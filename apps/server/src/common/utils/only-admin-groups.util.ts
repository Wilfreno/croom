export function describeOnlyAdminGroups(groupNames: string[]) {
  const namedGroups = groupNames
    .filter((name) => name.length > 0)
    .map((name) => `"${name}"`);
  const unnamedGroupCount = groupNames.length - namedGroups.length;

  const parts = [...namedGroups];
  if (unnamedGroupCount === 1) parts.push('1 unnamed group');
  if (unnamedGroupCount > 1) parts.push(`${unnamedGroupCount} unnamed groups`);

  return `make another member an admin of ${parts.join(', ')} before deleting your account`;
}
