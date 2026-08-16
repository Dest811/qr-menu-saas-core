// Authentication & Token Utility Helper

export function getAuthUser() {
  const token = localStorage.getItem('adminToken');
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);
    const role = localStorage.getItem('userRole') || decoded.role || (decoded.username ? 'superadmin' : 'cafe_owner');
    const cafeId = localStorage.getItem('userCafeId') || decoded.cafeId;
    return {
      token,
      role,
      cafeId: cafeId ? String(cafeId) : null,
      username: decoded.username || cafeId
    };
  } catch (e) {
    const role = localStorage.getItem('userRole');
    const cafeId = localStorage.getItem('userCafeId');
    return {
      token,
      role,
      cafeId: cafeId ? String(cafeId) : null
    };
  }
}

export function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userCafeId');
  localStorage.removeItem('cafeDetails');
}
