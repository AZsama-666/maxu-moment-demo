const LOCAL_KEYS = [
  'maxu-moment-demo-supply-v5',
  'maxu-moment-demo-supply-v4',
  'maxu-moment-demo-supply-v3',
  'maxu-moment-demo-supply-v2',
  'maxu-moment-demo-orders-v4',
  'maxu-moment-demo-orders-v3',
  'maxu-moment-demo-orders-v2',
  'maxu-moment-demo-stock-v2',
  'maxu-moment-demo-stock',
  'maxu-moment-demo-group-orders-v1',
  'maxu-moment-demo-activity-groups-v1',
  'maxu-moment-demo-group-seats-v1',
];

const SESSION_KEYS = [
  'maxu-moment-launch-draft-v2',
  'maxu-moment-launch-draft-v1',
];

/** 清空本机 Demo 持久化数据（供给 / 订单 / 草稿），并刷新页面。 */
export function resetDemoData() {
  for (const key of LOCAL_KEYS) {
    localStorage.removeItem(key);
  }
  for (const key of SESSION_KEYS) {
    sessionStorage.removeItem(key);
  }
  window.location.assign('/');
}
