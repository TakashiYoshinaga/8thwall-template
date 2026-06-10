// ターゲット JSON ファイルのパス（CLIで生成したファイル名に合わせて変更）
const TARGET_JSON = 'image-targets/my-target.json'

;(function () {
  let mesh = null
  const statusEl = document.getElementById('status')

  function showError(msg) {
    console.error(msg)
    statusEl.textContent = 'エラー: ' + msg
  }

  const cameraLifecycleModule = {
    name: 'camera-lifecycle',

    onCameraStatusChange: ({status, reason}) => {
      console.log('Camera status:', status, reason || '')

      if (status === 'requesting') {
        statusEl.textContent = 'カメラの使用を許可してください...'
      } else if (status === 'hasStream') {
        statusEl.textContent = 'カメラ映像を準備中...'
      } else if (status === 'hasVideo') {
        statusEl.textContent = 'ターゲット画像を探しています...'
      } else if (status === 'failed') {
        const message = reason === 'DENY_CAMERA'
          ? 'カメラの使用が許可されていません'
          : reason === 'NO_CAMERA'
            ? '利用できるカメラが見つかりません'
            : `カメラの起動に失敗しました (${reason || 'UNKNOWN'})`
        showError(message)
      }
    },

    onException: (err) => {
      showError(err && err.message ? err.message : String(err))
    },
  }

  // ---------------------------------------------------------------------------
  // イメージトラッキングイベントハンドラ
  // ---------------------------------------------------------------------------

  function onImageLoading({detail}) {
    console.log('Image targets loading:', detail.imageTargets)
    statusEl.textContent = 'ターゲットデータを読み込み中...'
  }

  function onImageScanning({detail}) {
    console.log('Image targets ready:', detail.imageTargets)
    statusEl.textContent = 'ターゲット画像を探しています...'
  }

  function onImageFound({detail}) {
    console.log('Image target found:', detail)
    if (!mesh) return
    const {position, rotation} = detail
    mesh.position.set(position.x, position.y, position.z)
    mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
    mesh.visible = true
    statusEl.textContent = `認識しました: ${detail.name}`
  }

  function onImageUpdated({detail}) {
    if (!mesh) return
    const {position, rotation} = detail
    mesh.position.set(position.x, position.y, position.z)
    mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w)
  }

  function onImageLost({detail}) {
    console.log('Image target lost:', detail.name)
    if (!mesh) return
    mesh.visible = false
    statusEl.textContent = 'ターゲット画像を探しています...'
  }

  // ---------------------------------------------------------------------------
  // Three.js シーン構築（XR8 起動後に onStart で呼ばれる）
  // ---------------------------------------------------------------------------

  const mySceneModule = {
    name: 'my-scene',
    onStart: () => {
      try {
        const {scene} = XR8.Threejs.xrScene()

        scene.add(new THREE.AmbientLight(0xffffff, 0.6))
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8)
        dirLight.position.set(1, 2, 3)
        scene.add(dirLight)

        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.1, 0.1),
          new THREE.MeshStandardMaterial({color: 0x00aaff})
        )
        mesh.visible = false
        scene.add(mesh)
      } catch (err) {
        showError('シーン初期化失敗: ' + err.message)
      }
    },

    listeners: [
      {event: 'reality.imageloading', process: onImageLoading},
      {event: 'reality.imagescanning', process: onImageScanning},
      {event: 'reality.imagefound', process: onImageFound},
      {event: 'reality.imageupdated', process: onImageUpdated},
      {event: 'reality.imagelost', process: onImageLost},
    ],
  }

  // ---------------------------------------------------------------------------
  // XR8 初期化
  // ---------------------------------------------------------------------------

  async function onXrLoaded() {
    console.log('XR8 loaded. Available modules:', Object.keys(XR8))

    // ターゲット JSON を読み込む
    let targetJson
    try {
      const res = await fetch(TARGET_JSON)
      if (!res.ok) throw new Error(`${TARGET_JSON} の取得に失敗 (HTTP ${res.status})`)
      targetJson = await res.json()
      console.log('Target JSON loaded:', targetJson)
    } catch (err) {
      showError(err.message)
      return
    }

    try {
      XR8.XrController.configure({
        disableWorldTracking: true,
        imageTargetData: [targetJson],
      })

      XR8.addCameraPipelineModule(XR8.GlTextureRenderer.pipelineModule())
      XR8.addCameraPipelineModule(XR8.Threejs.pipelineModule())
      XR8.addCameraPipelineModule(XR8.XrController.pipelineModule())
      XR8.addCameraPipelineModule(cameraLifecycleModule)
      XR8.addCameraPipelineModule(mySceneModule)

      statusEl.textContent = 'カメラを起動中...'
      XR8.run({
        canvas: document.getElementById('canvas'),
        allowedDevices: XR8.XrConfig.device().ANY,
        cameraConfig: {
          direction: XR8.XrConfig.camera().BACK,
        },
      })
    } catch (err) {
      showError('XR8 初期化失敗: ' + err.message)
    }
  }

  // 5 秒経っても xrloaded が来なければエラー表示
  const loadTimeout = setTimeout(() => {
    if (!window.XR8) showError('エンジンの読み込みがタイムアウトしました（ネットワークを確認してください）')
  }, 5000)

  function onXrLoadedWithClear() {
    clearTimeout(loadTimeout)
    onXrLoaded()
  }

  window.XR8 ? onXrLoadedWithClear() : window.addEventListener('xrloaded', onXrLoadedWithClear)
})()
