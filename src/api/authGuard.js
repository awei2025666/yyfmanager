const clearAuthStorage = () => {
  localStorage.removeItem('platform_token')
  localStorage.removeItem('platform_account')
  localStorage.removeItem('platform_vip_day')
  localStorage.removeItem('platform_avatar')
}

export const redirectToLogin = () => {
  clearAuthStorage()

  const currentPath = `${window.location.pathname}${window.location.search}`
  if (window.location.pathname === '/login') return

  window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
}
