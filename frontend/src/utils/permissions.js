/**
 * Role-Based Access Control (RBAC) Permission Definitions
 * 
 * Roles:
 * - admin: Full unrestricted enterprise control
 * - hr_admin / legal_admin / finance_admin / it_admin: Departmental admins
 * - manager: Team manager (workflows, documents, evaluation, knowledge graph, prompts)
 * - employee: General workspace user (overview, ask AI, document reading)
 */

export const ROLE_PERMISSIONS = {
  admin: [
    'overview',
    'chat',
    'documents',
    'upload',
    'agents',
    'tools',
    'prompts',
    'connectors',
    'kg',
    'evaluation',
    'users',
    'audit',
    'settings'
  ],
  manager: [
    'overview',
    'chat',
    'documents',
    'agents',
    'tools',
    'prompts',
    'kg',
    'evaluation'
  ],
  hr_admin: [
    'overview',
    'chat',
    'documents',
    'upload',
    'agents',
    'tools',
    'prompts',
    'kg',
    'audit'
  ],
  legal_admin: [
    'overview',
    'chat',
    'documents',
    'upload',
    'tools',
    'prompts',
    'kg',
    'audit'
  ],
  finance_admin: [
    'overview',
    'chat',
    'documents',
    'upload',
    'tools',
    'prompts',
    'kg',
    'audit'
  ],
  it_admin: [
    'overview',
    'chat',
    'documents',
    'upload',
    'connectors',
    'tools',
    'prompts',
    'kg',
    'evaluation',
    'settings'
  ],
  employee: [
    'overview',
    'chat',
    'documents',
    'tools'
  ]
};

/**
 * Check if a given user role can access a specific feature/page
 */
export function hasPageAccess(role, pageId) {
  if (!role) return false;
  const normalizedRole = role.toLowerCase();
  
  if (normalizedRole === 'admin') return true;

  const allowedPages = ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.employee;
  return allowedPages.includes(pageId);
}

/**
 * Filter navigation sections according to user role
 */
export function getAuthorizedSections(sections, role) {
  if (!role) return [];
  const normalizedRole = role.toLowerCase();
  if (normalizedRole === 'admin') return sections;

  return sections
    .map(section => ({
      ...section,
      items: section.items.filter(item => hasPageAccess(normalizedRole, item.id))
    }))
    .filter(section => section.items.length > 0);
}
