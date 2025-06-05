<script setup lang="ts">
import * as Cesium from 'cesium'
import { Viewer, Ion } from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import FanModel from './model/Fan.js'
import PlaneModel from './model/Plane.js'
import { ref, onMounted } from 'vue'

Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4ZDMzMzA1OC0xYjkwLTQ0MjctOWI3Yi03OTZkZGQ0N2YxNWQiLCJpZCI6MjIwNTYyLCJpYXQiOjE3MTc2NjczMDB9.RL9K8o6b-YRvYa04LepguqE_snKArtjQdMUBPSTxVMo'

const cesiumViewer = ref<Viewer | null>(null)
const fanAngle = 0
const entityFan = null
const entityFanBar = null
const planeModel = null
const planeAngle = 0

const fans = []
onMounted(() => {
  initMap()
  setTimeout(() => {
    addTianDiMap()
  }, 0)
})

const initMap = () => {
  const cesiumConfig = {
    // sceneMode: 2,
    // 主页按钮
    homeButton: false,
    // 场景模式选择器
    sceneModePicker: false,
    // 全屏按钮
    fullscreenButton: false,
    // 是否显示点击要素之后显示的信息
    infoBox: false,
    // 要素选中框
    selectionIndicator: false,
    // 影像切换
    baseLayerPicker: false,
    // 启用了阴影效果
    shadows: true,
    // 启用动画
    shouldAnimate: true,
    // 是否显示动画控件
    animation: false,
    // 是否显示时间线控件
    timeline: false,
    // 是否显示地名查找控件
    geocoder: false,
    // 是否显示帮助信息控件
    navigationHelpButton: false,
    contextOptions: {
      contextType: 2, // Webgl2:2 ; WebGPU:3
    },
    // 隐藏底部版权信息
    creditContainer: document.createElement('div'),
  }

  cesiumViewer.value = new Viewer('cesiumContainer', cesiumConfig)
  // 显示fps
  cesiumViewer.value.scene.debugShowFramesPerSecond = true

  const handler = new Cesium.ScreenSpaceEventHandler(cesiumViewer.value.scene.canvas)

  handler.setInputAction(onCesiumClick, Cesium.ScreenSpaceEventType.LEFT_CLICK)
}

const onCesiumClick = (movement) => {
  const pickedObject = cesiumViewer.value?.scene.pick(movement.position)

  if (Cesium.defined(pickedObject)) {
    console.log('Clicked on object:', pickedObject)
  } else {
    console.log('Clicked on empty space')
    // 添加一个圆
    const cartesian = cesiumViewer.value.scene.camera.pickEllipsoid(
      movement.position,
      cesiumViewer.value.scene.globe.ellipsoid,
    )

    console.log('Cartesian coordinates:', cartesian)
    if (cartesian) {
      // 将笛卡尔坐标转为经纬度
      const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
      const lon = Cesium.Math.toDegrees(cartographic.longitude)
      const lat = Cesium.Math.toDegrees(cartographic.latitude)
      const delta = 0.05 // 矩形半径，单位：度

      // cesiumViewer.value.entities.add({
      // position: cartesian,
      // ellipse: {
      //   semiMinorAxis: 5000.0,
      //   semiMajorAxis: 5000.0,
      //   material: Cesium.Color.RED.withAlpha(0.5),
      //   outline: true,
      //   extrudedHeight: 0,
      //   outlineColor: Cesium.Color.GREEN,
      // },
      // rectangle: {
      //   coordinates: Cesium.Rectangle.fromDegrees(
      //     lon - delta,
      //     lat - delta,
      //     lon + delta,
      //     lat + delta,
      //   ),
      //   material: Cesium.Color.BLUE.withAlpha(0.5),
      //   outline: true,
      //   outlineColor: Cesium.Color.YELLOW,
      // },
      // point: {
      //   color: Cesium.Color.RED.withAlpha(0.5),
      //   pixelSize: 50,
      //   outlineColor: Cesium.Color.RED,
      //   outlineWidth: 2,
      // },
      // })

      add3DModel(lon, lat, 0)
    }
  }
}

const addTianDiMap = () => {
  const baseUrl = 'http://t{s}.tianditu.gov.cn'
  const tiandiKey = 'c54ad8cca52a532ae87fe5fe21679582'
  const tdtLayer1 = new Cesium.UrlTemplateImageryProvider({
    url:
      baseUrl +
      '/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=' +
      tiandiKey,
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
  })
  // 矢量标注
  const tdtLayer2 = new Cesium.UrlTemplateImageryProvider({
    url:
      baseUrl +
      '/cva_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=' +
      tiandiKey,
    subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
  })

  // 影像图
  // const tdtLayer3 = new Cesium.UrlTemplateImageryProvider({
  //   url:
  //     baseUrl +
  //     '/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=' +
  //     tiandiKey,
  //   subdomains: ['0', '1', '2', '3'],
  // })

  // 通过相机设备默认坐标位置
  cesiumViewer.value.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.07, 40.05, 1000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: Cesium.Math.toRadians(0),
    },
  })

  // 添加天地图影像图层
  // cesiumViewer.value.imageryLayers.addImageryProvider(tdtLayer1)
  // 添加天地图矢量标注图层

  // cesiumViewer.value.imageryLayers.addImageryProvider(tdtLayer3)
  // cesiumViewer.value.imageryLayers.addImageryProvider(tdtLayer2)

  // planeModel = new PlaneModel({
  //   cesiumViewer: cesiumViewer.value,
  // })

  // planeModel.add({ lon: 116.07, lat: 40.05, height: 1000 })
  // planeModel.rotateLoop()
}

const add3DModel = (lon, lat, z) => {
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromDegrees(lon, lat, 0),
  )
  // entityFanBar = cesiumViewer.value.entities.add({
  //   name: '3D Model',
  //   position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),

  //   model: {
  //     uri: '/3d/fan-bar.glb',
  //     modelMatrix: modelMatrix,
  //     scale: 5000.0,
  //   },
  // })

  // entityFan = cesiumViewer.value.entities.add({
  //   name: '3D Model fan',
  //   position: Cesium.Cartesian3.fromDegrees(lon, lat, 70000),
  //   model: {
  //     uri: '/3d/fan.glb',
  //     modelMatrix: modelMatrix,
  //     scale: 5000.0,
  //     color: Cesium.Color.WHITE, // 强制叠加白色
  //   },
  // })

  const fanModel = new FanModel({
    cesiumViewer: cesiumViewer.value,
  })

  fanModel.add({ lon, lat, height: z })
  fanModel.rotateLoop()

  fans.push({
    lon,
    lat,
  })

  // const center = getFansCenter(fans)
  // const radius = 0.02 // 单位：度，实际距离可调整
  // const height = 300 // 飞机飞行高度

  // 动画：让飞机绕中心点飞行
  // cesiumViewer.value.scene.postRender.addEventListener(() => {
  //   console.log('postRender', planeModel)
  //   if (!planeModel) return
  //   planeAngle += 0.5 // 控制速度
  //   if (planeAngle >= 360) planeAngle -= 360
  //   const rad = Cesium.Math.toRadians(planeAngle)
  //   const lon = center.lon + radius * Math.cos(rad)
  //   const lat = center.lat + radius * Math.sin(rad)
  //   const position = Cesium.Cartesian3.fromDegrees(lon, lat, height)
  //   planeModel.position = position

  //   // 让飞机头部始终朝向中心
  //   const heading = Math.atan2(center.lon - lon, center.lat - lat)
  //   planeModel.orientation = Cesium.Transforms.headingPitchRollQuaternion(
  //     position,
  //     new Cesium.HeadingPitchRoll(heading, 0, 0),
  //   )
  // })

  console.log('planeModel', planeModel)
  // 移动飞机到点击位置
  if (planeModel && planeModel.entity) {
    // const heading = getHeadingFromTo(planeModel.lon, planeModel.lat, lon, lat) - 90 - 180
    // const fixedHeading = (heading + 360) % 360

    // // 2. 先旋转飞机头部
    // planeModel.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
    //   Cesium.Cartesian3.fromDegrees(planeModel.lon, planeModel.lat, planeModel.height || 0),
    //   new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(fixedHeading), 0, 0),
    // )

    setTimeout(() => {
      const start = planeModel.entity.position.getValue(Cesium.JulianDate.now())
      const startCarto = Cesium.Cartographic.fromCartesian(start)
      const startLon = Cesium.Math.toDegrees(startCarto.longitude)
      const startLat = Cesium.Math.toDegrees(startCarto.latitude)
      const startHeight = startCarto.height

      const endLon = lon
      const endLat = lat
      const endHeight = 200 // 目标高度

      const duration = 2000 // 2秒
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
        planeModel.entity.position = Cesium.Cartesian3.fromDegrees(currLon, currLat, currHeight)

        // 飞行过程中保持朝向目标
        const movingHeading = getHeadingFromTo(currLon, currLat, endLon, endLat) - 90 - 180
        // const fixedMovingHeading = (movingHeading + 360) % 360
        planeModel.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(
          Cesium.Cartesian3.fromDegrees(currLon, currLat, currHeight),
          new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(movingHeading), 0, 0),
        )

        if (t < 1) {
          requestAnimationFrame(animate)
        }
      }
      animate()
    }, 500) // 先旋转0.5秒再飞行
  }

  console.log('fans', fans)

  // cesiumViewer.value.flyTo(fanModel.entity, {
  //   duration: 2,
  //   offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 500),
  // })
}

const getHeadingFromTo = (startLon, startLat, endLon, endLat) => {
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

const onFly = () => {
  console.log('onFly')
}
</script>

<template>
  <!-- <button class="btn-fly" @click="onFly">fly</button> -->
  <div class="map" id="cesiumContainer"></div>
</template>

<style lang="scss" scoped>
#cesiumContainer {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.btn-fly {
  z-index: 999;
  position: absolute;
  width: 100px;
  line-height: 35px;
  background-color: #3388ff;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  border: none;
}
</style>
