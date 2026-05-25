export const getAvatarUrl = (user = {}) =>
  user.avatar ||
  user.avatarUrl ||
  user.headImg ||
  user.headImage ||
  user.headPortrait ||
  user.portrait ||
  user.photo ||
  ''

export const getNameInitial = (name = '') => {
  const value = String(name || '').trim()
  return value ? value.slice(0, 1) : '用'
}
