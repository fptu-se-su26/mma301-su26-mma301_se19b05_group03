export type Capability = 'student' | 'manage-learning' | 'admin';

const capabilityRoles: Record<Capability, string[]> = {
  student: ['student'],
  'manage-learning': ['lecturer', 'admin'],
  admin: ['admin'],
};

export const hasCapability = (role: string | undefined, capability: Capability) =>
  Boolean(role && capabilityRoles[capability].includes(role));
