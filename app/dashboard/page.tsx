import { redirect } from 'next/navigation'

/**
 * Legacy route. The old "dashboard" hub is replaced by Home (the farm command centre), so this
 * redirect keeps any existing links working.
 */
export default function DashboardRedirect() {
  redirect('/')
}
