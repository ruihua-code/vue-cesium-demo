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
let planeModel = null
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
    // terrain: Cesium.Terrain.fromWorldTerrain({
    //   // 启用地形照明
    //   requestVertexNormals: false,
    //   // 水效果
    //   requestWaterMask: true,
    // }),
  }

  cesiumViewer.value = new Viewer('cesiumContainer', cesiumConfig)

  // 启用地形照明
  cesiumViewer.value.scene.globe.enableLighting = true
  // 开启地形检测
  cesiumViewer.value.scene.globe.depthTestAgainstTerrain = true

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

      addFanModel(lon, lat, 0)
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
    destination: Cesium.Cartesian3.fromDegrees(113.236305, 34.611076, 700),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-15),
      roll: Cesium.Math.toRadians(0),
    },
  })

  // 添加天地图影像图层
  // cesiumViewer.value.imageryLayers.addImageryProvider(tdtLayer1)
  // 添加天地图矢量标注图层

  // cesiumViewer.value.imageryLayers.addImageryProvider(tdtLayer3)
  // cesiumViewer.value.imageryLayers.addImageryProvider(tdtLayer2)

  planeModel = new PlaneModel({
    cesiumViewer: cesiumViewer.value,
  })

  planeModel.add({ lon: 113.236305, lat: 34.611076, height: 400 })
  // planeModel.rotateLoop()
}

/**
 * 在点击位置添加3D 风扇模型
 * @param lon 经度
 * @param lat 纬度
 * @param z 高度(米)
 */
const addFanModel = (lon, lat, z) => {
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

  // 移动飞机到点击位置
  if (planeModel && planeModel.entity) {
    planeModel.flyToPosition(lon, lat, 300)
  }

  // cesiumViewer.value.flyTo(fanModel.entity, {
  //   duration: 2,
  //   offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-45), 500),
  // })
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
