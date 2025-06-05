import * as Cesium from 'cesium'
class PlaneModel {
  constructor({ cesiumViewer }) {
    this.cesiumViewer = cesiumViewer
    this.fanSpeed = 0 // Fan speed percentage (0-100)
    this.isOn = false // Fan state (on/off)
    this.uri = '/3d/plane.glb'
    this.scale = 150
    this.name = '3D无人机'
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
  add({ lon, lat, height }) {
    this.lon = lon
    this.lat = lat
    this.height = height
    const customShader = new Cesium.CustomShader({
      lightingModel: Cesium.LightingModel.UNLIT, //更改为UNLIT
    })
    this.entity = this.cesiumViewer.entities.add({
      name: this.name,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, 100),
      orientation: Cesium.Transforms.headingPitchRollQuaternion(
        Cesium.Cartesian3.fromDegrees(lon, lat, 100),
        new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(0), 0, 0),
      ),
      model: {
        uri: this.uri,
        scale: this.scale,
        customShader: customShader,
      },
    })
  }
  rotateLoop() {
    this.cesiumViewer.scene.postRender.addEventListener(() => {
      if (this.entity) {
        this.fanAngle -= 2 // 每帧增加5度，可调整速度
        if (this.fanAngle >= 360) this.fanAngle -= 360
        this.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
          Cesium.Cartesian3.fromDegrees(this.lon, this.lat, 0),
          new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(this.fanAngle), 0, 0),
        )
      }
    })
  }
}

export default PlaneModel
