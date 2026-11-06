export const canDeleteOrder = (status: string) => status === 'annulée';
export const shopTabs = ['stats', 'products', 'orders', 'reviews', 'shipping', 'messages', 'account'];
export const canOpenTab = (role: string, tab: string) => role === 'admin' || (role === 'manager' && shopTabs.includes(tab));