import { ref } from 'vue'
import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

const TOUR_COMPLETED_KEY = 'signalbridge:tour-completed'

export function useTutorialTour() {
  const isActive = ref(false)

  const steps: DriveStep[] = [
    {
      element: '[data-tour="app-title"]',
      popover: {
        title: 'Welcome to SignalBridge',
        description:
          'SignalBridge is a serial port monitor that lets you connect to devices, send commands, and inspect data in real time. Let\'s take a quick tour!',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="port-select"]',
      popover: {
        title: 'Port Selection',
        description:
          'Choose a serial port from the dropdown. Available ports are auto-detected. Use the refresh button next to it to rescan.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="refresh-ports"]',
      popover: {
        title: 'Refresh Ports',
        description: 'Click here to rescan and update the list of available serial ports.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="baud-rate"]',
      popover: {
        title: 'Baud Rate',
        description:
          'Select the communication speed. Common values are 9600 and 115200. Make sure it matches your device\'s configuration.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="connect-btn"]',
      popover: {
        title: 'Connect / Disconnect',
        description:
          'Click to establish or close the serial connection. The status badge next to it shows the current state.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="connection-status"]',
      popover: {
        title: 'Connection Status',
        description:
          'Shows whether you\'re connected or disconnected. A green dot means active connection.',
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="log-toolbar"]',
      popover: {
        title: 'Log Toolbar',
        description:
          'Control how logs are displayed. Freeze to pause the stream, Filter to show only highlighted terms, Highlight to mark keywords with colors, and Clear to wipe the log.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="log-viewport"]',
      popover: {
        title: 'Log Viewport',
        description:
          'Incoming serial data appears here in real time. Logs are color-coded: blue for received data, green for transmitted, red for errors, and orange for warnings. The minimap on the right edge shows an overview with error/warning markers.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="command-bar"]',
      popover: {
        title: 'Command Bar',
        description:
          'Type commands here to send to the connected device. Press Enter to send, or use Ctrl+K from anywhere to focus this input. Autocomplete suggests from your history and favorites.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tour="command-history"]',
      popover: {
        title: 'Command History',
        description:
          'Previously sent commands appear here. Hover over any entry to copy it or resend it with one click.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tour="favorites-panel"]',
      popover: {
        title: 'Favorites',
        description:
          'Save frequently used commands here for quick access. Add new favorites using the input at the top, then send or copy them with one click.',
        side: 'left',
        align: 'start',
      },
    },
    {
      element: '[data-tour="log-count"]',
      popover: {
        title: 'Log Counter',
        description:
          'Displays the total number of log lines currently visible. Useful for monitoring activity at a glance.',
        side: 'bottom',
        align: 'end',
      },
    },
  ]

  function startTour() {
    const tourDriver = driver({
      showProgress: true,
      animate: true,
      overlayColor: 'rgba(0, 0, 0, 0.75)',
      stagePadding: 6,
      stageRadius: 4,
      popoverClass: 'signalbridge-tour',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      progressText: '{{current}} of {{total}}',
      steps,
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_COMPLETED_KEY, 'true')
        isActive.value = false
        tourDriver.destroy()
      },
    })

    isActive.value = true
    tourDriver.drive()
  }

  function shouldShowTour(): boolean {
    return !localStorage.getItem(TOUR_COMPLETED_KEY)
  }

  function resetTour() {
    localStorage.removeItem(TOUR_COMPLETED_KEY)
  }

  return { isActive, startTour, shouldShowTour, resetTour }
}
