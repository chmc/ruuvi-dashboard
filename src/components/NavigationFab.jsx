import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SpeedDial from '@mui/material/SpeedDial'
import SpeedDialAction from '@mui/material/SpeedDialAction'
import HomeIcon from '@mui/icons-material/Home'
import TimelineIcon from '@mui/icons-material/Timeline'
import BuildIcon from '@mui/icons-material/Build'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'

/**
 * Navigation actions for the SpeedDial
 * @type {Array<{icon: JSX.Element, name: string, path: string}>}
 */
const actions = [
  { icon: <HomeIcon />, name: 'Dashboard', path: '/' },
  { icon: <TimelineIcon />, name: 'History', path: '/history' },
  { icon: <BuildIcon />, name: 'Diagnostics', path: '/diagnostics' },
]

/**
 * Floating Speed Dial navigation component
 * Provides quick navigation between Dashboard, History, and Diagnostics screens
 * @returns {JSX.Element}
 */
const NavigationFab = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  /**
   * Handle navigation action click
   * @param {string} path - Route path to navigate to
   */
  const handleActionClick = (path) => {
    navigate(path)
    handleClose()
  }

  return (
    <SpeedDial
      ariaLabel="Open navigation"
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
      }}
      icon={open ? <CloseIcon /> : <MenuIcon />}
      onClose={handleClose}
      onOpen={handleOpen}
      open={open}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={() => handleActionClick(action.path)}
        />
      ))}
    </SpeedDial>
  )
}

export default NavigationFab
