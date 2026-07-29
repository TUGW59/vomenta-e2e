export function mutationSafetyMessages(
  source,
  { lifecycleExclusion = null } = {}
) {
  const messages = [];
  const hasMutationTest =
    /\btest(?:\.describe|\.fixme)?\s*\(\s*['"`][^'"`]*@mutation/.test(source);
  if (!hasMutationTest) return messages;

  if (!source.includes('mutationGuard')) {
    messages.push('@mutation testi mutationGuard kullanmalı');
  }
  const guardCalls = source.match(/\bmutationGuard\s*\(/g)?.length || 0;
  const awaitedGuardCalls =
    source.match(/\bawait\s+mutationGuard\s*\(/g)?.length || 0;
  if (guardCalls > awaitedGuardCalls) {
    messages.push(
      '@mutation testi tenant preflight tamamlanmadan ilerleyemez: mutationGuard await edilmeli'
    );
  }
  const exclusionMode = lifecycleExclusion?.mode || '';
  const isReadOnlyAudit = exclusionMode === 'read-only';

  if (!source.includes('testEntity') && !isReadOnlyAudit) {
    messages.push('@mutation testi testEntity yaşam-döngüsü fixture’ını kullanmalı');
  }
  if (!source.includes('testEntity.create') && !lifecycleExclusion) {
    messages.push(
      '@mutation spec’i kalıcı create için testEntity.create yaşam döngüsünü kullanmalı'
    );
  }
  if (source.includes('testEntity.cleanup') && !lifecycleExclusion) {
    messages.push(
      '@mutation spec’inde doğrudan testEntity.cleanup yasak; baseline zorunlu testEntity.create kullanın'
    );
  }
  if (exclusionMode === 'fixme' && !source.includes('test.fixme')) {
    messages.push(
      'mutation yaşam-döngüsü N/A istisnası yalnız test.fixme varken geçerlidir'
    );
  }
  if (
    isReadOnlyAudit &&
    !source.includes('const MUTATION_LIFECYCLE_READ_ONLY = true')
  ) {
    messages.push(
      'salt-okunur mutation denetimi MUTATION_LIFECYCLE_READ_ONLY = true işareti taşımalı'
    );
  }
  if (
    isReadOnlyAudit &&
    /\b(?:testEntity|api|request)\b|(?:\.|\b)(?:create|save|delete|remove|publish|bulkAdd|bulkDelete)\w*\s*\(/.test(
      source
    )
  ) {
    messages.push(
      'salt-okunur mutation denetimi write fixture’ı veya create/save/delete/publish çağrısı içeremez'
    );
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
  const command = scripts?.['test:mutation'] || '';
  for (const required of ['--retries=0', '--workers=1']) {
    if (!command.includes(required)) {
      messages.push(`test:mutation mutasyon güvenliği için ${required} içermeli`);
    }
  }
  if (scripts?.['test:mutation:prod']) {
    messages.push(
      'test:mutation:prod yasak: production mutasyonu için kaçış komutu bulunamaz'
    );
  }
  if (command.includes('ALLOW_PROD_MUTATIONS')) {
    messages.push(
      'test:mutation production izin bayrağı içeremez; yalnız staging desteklenir'
    );
  }
  return messages;
}
