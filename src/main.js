import './style.css'

// Global state
let currentRoute = '/login'
let currentUser = null
let isLoading = false

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3000'

// Initialize app
function init() {
    // Check for token in URL
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')

    if (token) {
        localStorage.setItem('auth_token', token)
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname)
        currentRoute = '/dashboard'
    } else if (localStorage.getItem('auth_token')) {
        currentRoute = '/dashboard'
    } else {
        currentRoute = '/login'
    }

    render()
}

// Render app
function render() {
    const root = document.getElementById('root')
    root.innerHTML = ''

    const token = localStorage.getItem('auth_token')

    // Navigation
    const nav = document.createElement('nav')
    nav.className = 'bg-white shadow'
    nav.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16 items-center">
                <div class="text-2xl font-bold text-blue-600">SAML SSO POC</div>
                <div class="flex items-center space-x-4">
                    ${token ? `
                        <button id="logoutBtn" type="button" class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                            Logout
                        </button>
                    ` : `
                        <button id="loginNavBtn" type="button" class="px-4 py-2 text-gray-600 hover:text-gray-900">
                            Login
                        </button>
                    `}
                </div>
            </div>
        </div>
    `
    root.appendChild(nav)

    // Main content
    const main = document.createElement('main')
    main.className = 'flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full'

    if (currentRoute === '/login') {
        main.innerHTML = renderLoginPage()
    } else if (currentRoute === '/dashboard') {
        if (!token) {
            window.location.href = '/'
            return
        }
        main.innerHTML = renderDashboard()
    }

    main.classList.add('fade-in')
    root.appendChild(main)

    bindLoginHandlers(main)
}

function bindLoginHandlers(main) {
    const form = main.querySelector('#loginForm')
    if (form) {
        form.addEventListener('submit', handleDiscovery)
    }

    const logoutBtn = document.getElementById('logoutBtn')
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout)
    }

    const loginNavBtn = document.getElementById('loginNavBtn')
    if (loginNavBtn) {
        loginNavBtn.addEventListener('click', () => {
            currentRoute = '/login'
            render()
        })
    }
}

function renderLoginPage() {
    return `
        <div class="flex items-center justify-center py-12 px-4">
            <div class="w-full max-w-md space-y-8">
                <div>
                    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        SAML SSO Login
                    </h2>
                    <p class="mt-2 text-center text-sm text-gray-600">
                        Sign in to your organization using SAML 2.0 SSO
                    </p>
                </div>

                <form id="loginForm" class="mt-8 space-y-6">
                    <div id="errorMessage" class="hidden rounded-md bg-red-50 p-4 text-sm text-red-700"></div>

                    <div class="rounded-md shadow-sm space-y-4">
                        <div>
                            <label for="email" class="sr-only">Work Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@company.com"
                                class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div class="text-center text-gray-500 text-sm">OR</div>

                        <div>
                            <label for="domain" class="sr-only">Organization Domain</label>
                            <input
                                id="domain"
                                name="domain"
                                type="text"
                                placeholder="company.com"
                                class="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            ${isLoading ? 'Discovering...' : 'Continue with SSO'}
                        </button>
                    </div>
                </form>

                <div class="rounded-md bg-blue-50 p-4 text-sm text-blue-700">
                    <p class="font-medium">Demo Domains:</p>
                    <ul class="mt-2 space-y-1 list-disc list-inside">
                        <li>dev-tenant.com</li>
                        <li>example.com</li>
                        <li>company.com</li>
                    </ul>
                </div>
            </div>
        </div>
    `
}

function renderDashboard() {
    const token = localStorage.getItem('auth_token')
    let userInfo = null

    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        userInfo = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            account_type: payload.account_type,
            saml_connection_id: payload.saml_connection_id,
        }
    } catch (e) {
        console.error('Failed to decode token:', e)
        localStorage.removeItem('auth_token')
        currentRoute = '/login'
        render()
        return ''
    }

    return `
        <div class="space-y-8">
            <div>
                <h2 class="text-2xl font-bold text-gray-900">Welcome to SAML SSO</h2>
                <p class="mt-1 text-sm text-gray-600">
                    You have been successfully authenticated via SAML 2.0
                </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- User Information -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">User Information</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Name</label>
                            <p class="mt-1 text-sm text-gray-900">${userInfo.name}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Email</label>
                            <p class="mt-1 text-sm text-gray-900">${userInfo.email}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600">User ID</label>
                            <p class="mt-1 text-sm text-gray-900 font-mono text-xs">${userInfo.id}</p>
                        </div>
                    </div>
                </div>

                <!-- Tenant Information -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-medium text-gray-900 mb-4">Tenant Information</h3>
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Tenant ID</label>
                            <p class="mt-1 text-sm text-gray-900 font-mono text-xs">${userInfo.saml_connection_id}</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-600">Account Type</label>
                            <p class="mt-1 text-sm text-gray-900">${userInfo.account_type}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Authentication Details -->
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Authentication Details</h3>
                <div class="space-y-4">
                    <div>
                        <p class="text-sm text-gray-600">✓ Successfully authenticated via SAML 2.0</p>
                        <p class="text-sm text-gray-600 mt-1">JWT token issued and stored securely</p>
                        <p class="text-sm text-gray-600 mt-1">Token expires in 1 hour</p>
                    </div>
                </div>
            </div>

            <!-- Features -->
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Features Demonstrated</h3>
                <ul class="space-y-2 text-sm text-gray-700">
                    <li class="flex items-center">
                        <span class="text-green-500 mr-2">✓</span>
                        Multi-tenant SAML 2.0 support
                    </li>
                    <li class="flex items-center">
                        <span class="text-green-500 mr-2">✓</span>
                        Domain discovery (email routing)
                    </li>
                    <li class="flex items-center">
                        <span class="text-green-500 mr-2">✓</span>
                        Just-In-Time (JIT) user provisioning
                    </li>
                    <li class="flex items-center">
                        <span class="text-green-500 mr-2">✓</span>
                        JWT token generation and validation
                    </li>
                    <li class="flex items-center">
                        <span class="text-green-500 mr-2">✓</span>
                        Secure browser-based session management
                    </li>
                    <li class="flex items-center">
                        <span class="text-green-500 mr-2">✓</span>
                        Protected routes with authentication guards
                    </li>
                </ul>
            </div>
        </div>
    `
}

async function handleDiscovery(event) {
    event.preventDefault()
    isLoading = true
    render()

    const email = document.getElementById('email')?.value?.trim() || ''
    const domain = document.getElementById('domain')?.value?.trim() || ''

    // Extract domain from email if provided
    let lookupDomain = email.includes('@') ? email.split('@')[1] : domain

    if (!lookupDomain) {
        isLoading = false
        render()
        const errorDiv = document.getElementById('errorMessage')
        if (errorDiv) {
            errorDiv.textContent = 'Please enter a valid email or domain'
            errorDiv.classList.remove('hidden')
        }
        return
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/saml/connections/lookup?domain=${encodeURIComponent(lookupDomain)}`)
        const data = await response.json()

        if (data.found && data.sso_endpoint) {
            const returnUrl = `${FRONTEND_URL}/?token=`
            const loginUrl = `${data.sso_endpoint}?return_url=${encodeURIComponent(returnUrl.replace('?token=', ''))}`
            window.location.href = loginUrl
            return
        }

        isLoading = false
        render()
        const errorDiv = document.getElementById('errorMessage')
        if (errorDiv) {
            errorDiv.textContent = data.error || 'No SSO configuration found for this domain'
            errorDiv.classList.remove('hidden')
        }
    } catch (error) {
        isLoading = false
        render()
        const errorDiv = document.getElementById('errorMessage')
        if (errorDiv) {
            errorDiv.textContent = 'Failed to discover SAML configuration'
            errorDiv.classList.remove('hidden')
        }
        console.error('Discovery error:', error)
    }
}

function handleLogout() {
    localStorage.removeItem('auth_token')
    currentRoute = '/login'
    render()
}

// Route handling
window.addEventListener('popstate', () => {
    const token = localStorage.getItem('auth_token')
    currentRoute = token ? '/dashboard' : '/login'
    render()
})

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
} else {
    init()
}
