import { useEffect, useMemo, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

export function useDashboardNavigation({ architectures = [], user = null }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // 1. Resolve Architecture ID from URL > localStorage > user > default 'buy-and-sell'
  const activeArchId = useMemo(() => {
    const fromUrl = searchParams.get('arch')
    if (fromUrl && architectures.some((a) => a.id === fromUrl)) {
      return fromUrl
    }
    try {
      const fromStorage = localStorage.getItem('exbos_active_arch')
      if (fromStorage && architectures.some((a) => a.id === fromStorage)) {
        return fromStorage
      }
    } catch (e) {}
    return user?.architectureId || 'buy-and-sell'
  }, [searchParams, architectures, user])

  const currentArch = useMemo(() => {
    return (
      architectures.find((a) => a.id === activeArchId) || architectures[1] || {}
    )
  }, [architectures, activeArchId])

  const navMap = useMemo(() => currentArch.navigation || {}, [currentArch])

  // 2. Resolve Module from URL > localStorage > 'Overview'
  const activeModule = useMemo(() => {
    const fromUrl = searchParams.get('module') || searchParams.get('mod')
    if (fromUrl && navMap[fromUrl]) {
      return fromUrl
    }
    try {
      const fromStorage = localStorage.getItem(
        `exbos_active_module_${activeArchId}`
      )
      if (fromStorage && navMap[fromStorage]) {
        return fromStorage
      }
    } catch (e) {}
    return 'Overview'
  }, [searchParams, navMap, activeArchId])

  // 3. Resolve Page from URL > localStorage > subpages[0] > 'Dashboard'
  const activePage = useMemo(() => {
    const pages = navMap[activeModule] || ['Dashboard']
    const fromUrl = searchParams.get('page') || searchParams.get('sub')
    if (fromUrl && pages.includes(fromUrl)) {
      return fromUrl
    }
    try {
      const fromStorage = localStorage.getItem(
        `exbos_active_page_${activeArchId}`
      )
      if (fromStorage && pages.includes(fromStorage)) {
        return fromStorage
      }
    } catch (e) {}
    return pages[0] || 'Dashboard'
  }, [searchParams, navMap, activeModule, activeArchId])

  // Synchronize to URL & localStorage when URL params are missing or different
  useEffect(() => {
    const urlArch = searchParams.get('arch')
    const urlMod = searchParams.get('module')
    const urlPage = searchParams.get('page')

    if (
      urlArch !== activeArchId ||
      urlMod !== activeModule ||
      urlPage !== activePage
    ) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('arch', activeArchId)
          next.set('module', activeModule)
          next.set('page', activePage)
          return next
        },
        { replace: true }
      )
    }

    try {
      localStorage.setItem('exbos_active_arch', activeArchId)
      localStorage.setItem(`exbos_active_module_${activeArchId}`, activeModule)
      localStorage.setItem(`exbos_active_page_${activeArchId}`, activePage)
    } catch (e) {
      // ignore
    }
  }, [activeArchId, activeModule, activePage, searchParams, setSearchParams])

  // Architecture Switcher Handler
  const handleArchSwitch = useCallback(
    (newArchId) => {
      const targetArch =
        architectures.find((a) => a.id === newArchId) || architectures[1] || {}
      const targetNav = targetArch.navigation || {}
      let nextMod = 'Overview'
      let nextPage = 'Dashboard'

      try {
        const savedMod = localStorage.getItem(`exbos_active_module_${newArchId}`)
        nextMod = savedMod && targetNav[savedMod] ? savedMod : 'Overview'
        const subList = targetNav[nextMod] || ['Dashboard']
        const savedPage = localStorage.getItem(`exbos_active_page_${newArchId}`)
        nextPage =
          savedPage && subList.includes(savedPage) ? savedPage : subList[0] || 'Dashboard'

        localStorage.setItem('exbos_active_arch', newArchId)
        localStorage.setItem(`exbos_active_module_${newArchId}`, nextMod)
        localStorage.setItem(`exbos_active_page_${newArchId}`, nextPage)
      } catch (e) {}

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('arch', newArchId)
          next.set('module', nextMod)
          next.set('page', nextPage)
          return next
        },
        { replace: true }
      )
    },
    [architectures, setSearchParams]
  )

  // Module Click Handler
  const handleModuleClick = useCallback(
    (mod) => {
      const firstSub = (navMap[mod] || ['Dashboard'])[0]
      try {
        localStorage.setItem(`exbos_active_module_${activeArchId}`, mod)
        localStorage.setItem(`exbos_active_page_${activeArchId}`, firstSub)
      } catch (e) {}

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('arch', activeArchId)
          next.set('module', mod)
          next.set('page', firstSub)
          return next
        },
        { replace: true }
      )
    },
    [activeArchId, navMap, setSearchParams]
  )

  // Subpage Click Handler
  const setActivePage = useCallback(
    (page) => {
      try {
        localStorage.setItem(`exbos_active_page_${activeArchId}`, page)
      } catch (e) {}

      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('arch', activeArchId)
          next.set('module', activeModule)
          next.set('page', page)
          return next
        },
        { replace: true }
      )
    },
    [activeArchId, activeModule, setSearchParams]
  )

  const setActiveArchId = useCallback(
    (newArchId) => {
      handleArchSwitch(newArchId)
    },
    [handleArchSwitch]
  )

  const setActiveModule = useCallback(
    (newMod) => {
      handleModuleClick(newMod)
    },
    [handleModuleClick]
  )

  return {
    searchParams,
    setSearchParams,
    navigate,
    activeArchId,
    setActiveArchId,
    activeModule,
    setActiveModule,
    activePage,
    setActivePage,
    handleArchSwitch,
    handleModuleClick
  }
}
