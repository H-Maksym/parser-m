export type StubKey =
  | 'geoUnavailable'
  | 'geoBlocked'
  | 'unsupportedBrowser'
  | 'noAccess'
  | 'subscriptionRequired'
  | 'invalidSubscription'
  | 'paymentRequired'
  | 'purchaseRequired'
  | 'ageRestricted'
  | 'temporarilyUnavailable'
  | 'contentUnavailable'
  | 'blocked'
  | 'removed'
  | 'vpnDetected'
  | 'drmUnsupported'
  | 'licenceRestricted'
  | 'countryRestricted';

const STUB: Record<StubKey, string> = {
  geoUnavailable: 'Геоблок: недоступно у вашій країні',
  geoBlocked: 'Геоблок',
  unsupportedBrowser: 'Браузер не підтримується',
  noAccess: 'Немає доступу',
  subscriptionRequired: 'Потрібна підписка',
  invalidSubscription: 'Недійсна підписка',
  paymentRequired: 'Потрібна оплата',
  purchaseRequired: 'Потрібно купити',
  ageRestricted: 'Вікове обмеження',
  temporarilyUnavailable: 'Тимчасово недоступно',
  contentUnavailable: 'Контент недоступний',
  blocked: 'Контент заблоковано',
  removed: 'Контент видалено',

  // Custom:
  vpnDetected: 'Виявлено VPN / Proxy',
  drmUnsupported: 'Ваш браузер не підтримує DRM',
  licenceRestricted: 'Обмеження правовласника',
  countryRestricted: 'Не доступно для вашої країни',
};

export function decodeStub(stub: string) {
  if (stub in STUB) {
    return STUB[stub as StubKey];
  }
  return `Unknown type of stub: ${stub}`;
}
