export function mutationSafetyMessages(source) {
  const messages = [];
  const hasMutationTest =
    /\btest(?:\.describe)?\s*\(\s*['"`][^'"`]*@mutation/.test(source);
  if (!hasMutationTest) return messages;

  if (!source.includes('mutationGuard')) {
    messages.push('@mutation testi mutationGuard kullanmalı');
  }
  if (!source.includes('testEntity')) {
    messages.push('@mutation testi testEntity yaşam-döngüsü fixture’ını kullanmalı');
  }
  if (!/test\.describe\.configure\s*\(\s*\{[^}]*\bretries\s*:\s*0\b/s.test(source)) {
    messages.push(
      '@mutation spec’i doğrudan çalıştırıldığında da retry yapmamalı: test.describe.configure({ retries: 0 })'
    );
  }
  if (/(?:^|[^\w.])cleanup\s*\(/m.test(source)) {
    messages.push('@mutation spec’inde ham cleanup yasak; testEntity.cleanup/create kullanın');
  }
  if (/testEntity\.cleanup\([^;]*?\.catch\(\s*\(\)\s*=>\s*\{\s*\}\s*\)/s.test(source)) {
    messages.push('cleanup hatası boş catch ile yutulamaz; orphan riski görünür kalmalı');
  }
  return messages;
}

export function mutationLaneMessages(scripts) {
  const messages = [];
  for (const scriptName of ['test:mutation', 'test:mutation:prod']) {
    const command = scripts?.[scriptName] || '';
    for (const required of ['--retries=0', '--workers=1']) {
      if (!command.includes(required)) {
        messages.push(`${scriptName} mutasyon güvenliği için ${required} içermeli`);
      }
    }
  }
  return messages;
}
