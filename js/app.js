const TARGET_JSON = 'image-targets/my-target.json'

;(function () {
  let targetAnchor = null
  let cube = null
  const statusEl = document.getElementById('status')
  const canvas = document.getElementById('canvas')

  function showError(error) {
    const message = error && error.message ? error.message : String(error)
    console.error(error)
    statusEl.textContent = `Error: ${message}`
  }

  function updateTarget(detail) {
    if (!targetAnchor || !cube) return

    const {position, rotation, scale = 1, scaledWidth = 1, scaledHeight = 1} = detail
    const cubeSize = Math.min(scaledWidth, scaledHeight) * 0.25

    targetAnchor.position.copy(position)
    targetAnchor.quaternion.copy(rotation)
    targetAnchor.scale.setScalar(scale)
    targetAnchor.visible = true
    cube.scale.setScalar(cubeSize)
    cube.position.z = cubeSize / 2
  }

  function syncCanvasSize() {
    const width = window.innerWidth
    const height = window.innerHeight

    if (canvas.width === width && canvas.height === height) return

    canvas.width = width
    canvas.height = height
  }

  const fullWindowCanvasModule = {
    name: 'full-window-canvas',
    onAttach: () => {
      syncCanvasSize()
      window.addEventListener('resize', syncCanvasSize)
      window.visualViewport?.addEventListener('resize', syncCanvasSize)
    },
    onDeviceOrientationChange: () => {
      window.requestAnimationFrame(syncCanvasSize)
    },
    onDetach: () => {
      window.removeEventListener('resize', syncCanvasSize)
      window.visualViewport?.removeEventListener('resize', syncCanvasSize)
    },
  }

  const imageTrackingModule = {
    name: 'image-tracking-demo',
    onStart: () => {
      const {scene} = XR8.Threejs.xrScene()

      scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2))
      const light = new THREE.DirectionalLight(0xffffff, 0.8)
      light.position.set(1, 2, 3)
      scene.add(light)

      targetAnchor = new THREE.Group()
      targetAnchor.visible = false
      cube = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.MeshStandardMaterial({color: 0x00aaff, roughness: 0.65})
      )
      targetAnchor.add(cube)
      scene.add(targetAnchor)
    },

    onCameraStatusChange: ({status, reason}) => {
      if (status === 'requesting') {
        statusEl.textContent = 'Please allow camera access...'
      } else if (status === 'hasVideo') {
        statusEl.textContent = 'Loading target image...'
      } else if (status === 'failed') {
        const message = reason === 'DENY_CAMERA'
          ? 'Camera access was denied'
          : reason === 'NO_CAMERA'
            ? 'No usable camera was found'
            : `Failed to start the camera (${reason || 'UNKNOWN'})`
        showError(message)
      }
    },

    onException: showError,

    listeners: [
      {
        event: 'reality.imagescanning',
        process: () => {
          statusEl.textContent = 'Looking for the target image...'
        },
      },
      {
        event: 'reality.imagefound',
        process: ({detail}) => {
          updateTarget(detail)
          statusEl.textContent = `Found: ${detail.name}`
        },
      },
      {
        event: 'reality.imageupdated',
        process: ({detail}) => updateTarget(detail),
      },
      {
        event: 'reality.imagelost',
        process: () => {
          if (targetAnchor) targetAnchor.visible = false
          statusEl.textContent = 'Looking for the target image...'
        },
      },
    ],
  }

  async function onXrLoaded() {
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Open this page over HTTPS or on localhost to use the camera')
      }

      const res = await fetch(TARGET_JSON)
      if (!res.ok) throw new Error(`Failed to fetch ${TARGET_JSON} (HTTP ${res.status})`)
      const targetJson = await res.json()

      XR8.XrController.configure({
        disableWorldTracking: true,
        imageTargetData: [targetJson],
      })

      XR8.addCameraPipelineModules([
        fullWindowCanvasModule,
        XR8.GlTextureRenderer.pipelineModule(),
        XR8.Threejs.pipelineModule(),
        XR8.XrController.pipelineModule(),
        imageTrackingModule,
      ])

      statusEl.textContent = 'Starting the camera...'
      syncCanvasSize()
      XR8.run({
        canvas,
        allowedDevices: XR8.XrConfig.device().ANY,
      })
    } catch (error) {
      showError(error)
    }
  }

  window.XR8 ? onXrLoaded() : window.addEventListener('xrloaded', onXrLoaded, {once: true})
})()
