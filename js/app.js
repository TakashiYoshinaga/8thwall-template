const TARGET_JSON = 'image-targets/my-target.json'

;(function () {
  let targetAnchor = null
  let cube = null
  const statusEl = document.getElementById('status')

  function showError(error) {
    const message = error && error.message ? error.message : String(error)
    console.error(error)
    statusEl.textContent = `エラー: ${message}`
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
        statusEl.textContent = 'カメラの使用を許可してください...'
      } else if (status === 'hasVideo') {
        statusEl.textContent = 'ターゲット画像を読み込み中...'
      } else if (status === 'failed') {
        const message = reason === 'DENY_CAMERA'
          ? 'カメラの使用が許可されていません'
          : reason === 'NO_CAMERA'
            ? '利用できるカメラが見つかりません'
            : `カメラの起動に失敗しました (${reason || 'UNKNOWN'})`
        showError(message)
      }
    },

    onException: showError,

    listeners: [
      {
        event: 'reality.imagescanning',
        process: () => {
          statusEl.textContent = 'ターゲット画像を探しています...'
        },
      },
      {
        event: 'reality.imagefound',
        process: ({detail}) => {
          updateTarget(detail)
          statusEl.textContent = `認識しました: ${detail.name}`
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
          statusEl.textContent = 'ターゲット画像を探しています...'
        },
      },
    ],
  }

  async function onXrLoaded() {
    try {
      if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('カメラを使うには HTTPS または localhost で開いてください')
      }

      const res = await fetch(TARGET_JSON)
      if (!res.ok) throw new Error(`${TARGET_JSON} の取得に失敗 (HTTP ${res.status})`)
      const targetJson = await res.json()

      XR8.XrController.configure({
        disableWorldTracking: true,
        imageTargetData: [targetJson],
      })

      XR8.addCameraPipelineModules([
        XR8.GlTextureRenderer.pipelineModule(),
        XR8.Threejs.pipelineModule(),
        XR8.XrController.pipelineModule(),
        imageTrackingModule,
      ])

      statusEl.textContent = 'カメラを起動中...'
      XR8.run({
        canvas: document.getElementById('canvas'),
        allowedDevices: XR8.XrConfig.device().ANY,
      })
    } catch (error) {
      showError(error)
    }
  }

  window.XR8 ? onXrLoaded() : window.addEventListener('xrloaded', onXrLoaded, {once: true})
})()
