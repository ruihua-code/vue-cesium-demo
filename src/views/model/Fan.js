import * as Cesium from 'cesium'

class FanModel {
  constructor({ cesiumViewer }) {
    this.cesiumViewer = cesiumViewer
    this.fanSpeed = 0 // Fan speed percentage (0-100)
    this.isOn = false // Fan state (on/off)
    this.uri = '/3d/fan-bar.glb'
    this.scale = 10
    this.name = '3D电力风扇'
    /**
     * 经度,范围 [-180, 180],单位：度
     */
    this.lon = null
    /**
     * 纬度,范围 [-90, 90],单位：度
     */
    this.lat = null
    /**
     * 高度（海拔）,单位米
     */
    this.height = null
    this.entity = null
    this.fanEntity = null
    this.fanAngle = 0
  }

  /**
   * 添加风扇模型到场景中
   * @param {*} param0
   */
  async add({ lon, lat, height }) {
    // 表示模型采用“无光照”渲染，显示为本身材质颜色，不受太阳光等影响，常用于需要纯色或自发光效果的模型
    const customShader = new Cesium.CustomShader({
      lightingModel: Cesium.LightingModel.UNLIT, //更改为UNLIT
    })

    this.lon = lon
    this.lat = lat
    this.height = height

    const positions = [Cesium.Cartographic.fromDegrees(lon, lat)]
    let groundHeight = 0
    let updatedPositions = null
    console.log(
      '添加风扇位置-this.cesiumViewer.terrainProvider:',
      this.cesiumViewer.terrainProvider,
    )
    if (this.cesiumViewer.terrainProvider.availability) {
      updatedPositions = await Cesium.sampleTerrainMostDetailed(
        this.cesiumViewer.terrainProvider,
        positions,
      )
    }

    groundHeight = updatedPositions ? updatedPositions[0].height : groundHeight
    // 添加风扇，z=groundHeight 或 groundHeight+自定义高度

    console.log('风扇位置-高度:', lon, lat, groundHeight)

    // 先添风扇柱子
    this.entity = this.cesiumViewer.entities.add({
      name: this.name,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, groundHeight),
      //   orientation: Cesium.Transforms.headingPitchRollQuaternion(
      //     Cesium.Cartesian3.fromDegrees(lon, lat, 0),
      //     new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(0, 0, 0)),
      //   ),
      // heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // 高度参考模式
      // disableDepthTestDistance: Number.POSITIVE_INFINITY, // 禁用深度测试
      model: {
        uri: this.uri,
        scale: this.scale,
        customShader: customShader,
        clampToHeight: true, // 确保模型贴合地形
      },
    })

    // 再添加风扇
    this.fanEntity = this.cesiumViewer.entities.add({
      name: '风扇',
      position: Cesium.Cartesian3.fromDegrees(lon, lat, groundHeight + 140),
      model: {
        uri: '/3d/fan.glb',
        scale: this.scale,
        customShader: customShader,
      },
    })

    // const cartesian = fanBar.position.getValue(Cesium.JulianDate.now())
    // if (cartesian) {
    //   const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
    //   const height = cartographic.height
    //   console.log('fanBar 高度:', height, height * 50)
    // }
  }
  /**
   * 开启风扇旋转
   */
  rotateLoop() {
    this.cesiumViewer.scene.postRender.addEventListener(() => {
      if (this.fanEntity) {
        this.fanAngle -= 2 // 每帧增加5度，可调整速度
        if (this.fanAngle >= 360) this.fanAngle -= 360
        this.fanEntity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
          Cesium.Cartesian3.fromDegrees(this.lon, this.lat, 0),
          new Cesium.HeadingPitchRoll(0, Cesium.Math.toRadians(this.fanAngle), 0),
        )
      }
    })
  }
}

export default FanModel
