// Profile avatar catalog for Oja.
//
// The ids here are the source of truth: they must match the client-side
// AVATAR_IDS in client/src/components/Avatars.jsx, and any avatar stored
// on users.avatar must pass isValidAvatar() before being saved.

export const AVATARS = [
  { id: 'fox', label: 'Fox' },
  { id: 'robot', label: 'Robot' },
  { id: 'panda', label: 'Panda' },
  { id: 'ghost', label: 'Ghost' },
  { id: 'frog', label: 'Frog' },
  { id: 'cat', label: 'Cat' },
  { id: 'owl', label: 'Owl' },
  { id: 'alien', label: 'Alien' },
  { id: 'ninja', label: 'Ninja' },
  { id: 'astronaut', label: 'Astronaut' },
];

const KNOWN_IDS = new Set(AVATARS.map((a) => a.id));

export const DEFAULT_AVATAR = 'fox';

/** True when id is one of the known avatar ids. */
export function isValidAvatar(id) {
  return typeof id === 'string' && KNOWN_IDS.has(id);
}
