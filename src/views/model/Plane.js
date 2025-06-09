import * as Cesium from 'cesium'
class PlaneModel {
  constructor({ cesiumViewer }) {
    this.cesiumViewer = cesiumViewer
    this.fanSpeed = 0 // Fan speed percentage (0-100)
    this.isOn = false // Fan state (on/off)
    this.uri = '/3d/j20.glb'
    this.scale = 500
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
    // 模型颜色使用默认
    const customShader = new Cesium.CustomShader({
      lightingModel: Cesium.LightingModel.UNLIT, //更改为UNLIT
    })
    this.entity = this.cesiumViewer.entities.add({
      name: this.name,
      position: Cesium.Cartesian3.fromDegrees(lon, lat, this.height),
      // orientation: Cesium.Transforms.headingPitchRollQuaternion(
      //   Cesium.Cartesian3.fromDegrees(lon, lat, 100),
      //   new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(0), 0, 0),
      // ),
      model: {
        uri: this.uri,
        scale: this.scale,
        customShader: customShader,
        color: Cesium.Color.ORANGE,
      },
    })
  }
  rotateLoop() {
    this.cesiumViewer.scene.postRender.addEventListener(() => {
      if (this.entity) {
        this.fanAngle += 1 // 每帧增加5度，可调整速度
        if (this.fanAngle >= 360) this.fanAngle -= 360
        this.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
          Cesium.Cartesian3.fromDegrees(this.lon, this.lat, 0),
          new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(this.fanAngle), 0, 0),
        )
      }
    })
  }

  /**
   * 飞行到目标位置
   * @param {*} lon 经度
   * @param {*} lat 纬度
   * @param {*} height 目标高度
   * @param {*} duration 飞行时长
   */
  flyToPosition(lon, lat, height, duration = 2000) {
    const start = this.entity.position.getValue(Cesium.JulianDate.now())
    const startCarto = Cesium.Cartographic.fromCartesian(start)
    const startLon = Cesium.Math.toDegrees(startCarto.longitude)
    const startLat = Cesium.Math.toDegrees(startCarto.latitude)
    const startHeight = startCarto.height
    const endLon = lon
    const endLat = lat
    const endHeight = height // 目标高度
    const frameRate = 60
    const totalFrames = (duration / 1000) * frameRate
    let frame = 0
    function animate() {
      frame++
      const t = Math.min(frame / totalFrames, 1)
      // 线性插值
      const currLon = startLon + (endLon - startLon) * t
      const currLat = startLat + (endLat - startLat) * t
      const currHeight = startHeight + (endHeight - startHeight) * t
      this.entity.position = Cesium.Cartesian3.fromDegrees(currLon, currLat, currHeight)

      // 飞行过程中保持朝向目标
      let movingHeading
      if (t < 1) {
        // 飞行中
        movingHeading = this.getHeadingFromTo(currLon, currLat, endLon, endLat) - 90 - 180
        const fixedMovingHeading = (movingHeading + 360) % 360
        this.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
          Cesium.Cartesian3.fromDegrees(currLon, currLat, currHeight),
          new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(fixedMovingHeading), 0, 0),
        )

        const distance = this.distance({
          current: {
            lon: currLon,
            lat: currLat,
            height: currHeight,
          },
          target: {
            lon,
            lat,
            height,
          },
        })

        console.log('距离:', distance)
        requestAnimationFrame(animate.bind(this))
      } else {
        // 飞行结束

        // 飞行结束后，保持最后一帧的朝向，不再用目标点和自身点计算heading
        movingHeading = this.getHeadingFromTo(startLon, startLat, endLon, endLat) - 90 - 180
        const fixedMovingHeading = (movingHeading + 360) % 360
        this.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
          Cesium.Cartesian3.fromDegrees(endLon, endLat, endHeight),
          new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(fixedMovingHeading), 0, 0),
        )
      }
    }
    animate.bind(this)()
  }

  getHeadingFromTo(startLon, startLat, endLon, endLat) {
    const toRad = Cesium.Math.toRadians
    const dLon = toRad(endLon - startLon)
    const lat1 = toRad(startLat)
    const lat2 = toRad(endLat)
    const y = Math.sin(dLon) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
    let heading = Math.atan2(y, x)
    heading = Cesium.Math.toDegrees(heading)
    // 转为0-360度
    return (heading + 360) % 360
  }

  /**
   * 检测两个经纬度的距离，单位米
   * @param {*} positions
   * @returns
   */
  distance(positions) {
    const { target, current } = positions
    const planePosition = Cesium.Cartesian3.fromDegrees(current.lon, current.lat, current.height)
    const targetPosition = Cesium.Cartesian3.fromDegrees(target.lon, target.lat, target.height)
    const distance = Cesium.Cartesian3.distance(planePosition, targetPosition)
    return distance
  }

  findEntity() {
    const entities = this.cesiumViewer.entities.values
    console.log('entities：', entities)
  }
}

export default PlaneModel
