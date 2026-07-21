import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { userApi } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let currentToken: string | null = null;

const resolveProjectId = () =>
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId ?? undefined;

export const registerForPush = async () => {
  try {
    if (!Device.isDevice) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Thông báo STE',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const settings = await Notifications.getPermissionsAsync();
    let status = settings.status;
    if (status !== 'granted') {
      const request = await Notifications.requestPermissionsAsync();
      status = request.status;
    }
    if (status !== 'granted') return;

    const projectId = resolveProjectId();
    const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    currentToken = tokenResponse.data;
    await userApi.registerPushToken(currentToken);
  } catch {
    currentToken = null;
  }
};

export const unregisterFromPush = async () => {
  if (!currentToken) return;
  try {
    await userApi.removePushToken(currentToken);
  } catch {
    return;
  } finally {
    currentToken = null;
  }
};
