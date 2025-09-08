// 坐标转换工具
// 用于处理不同坐标系之间的转换

// WGS-84 到 GCJ-02 的转换（GPS坐标转国内地图坐标）
function wgs84ToGcj02(lng, lat) {
    const a = 6378245.0; // 长半轴
    const ee = 0.00669342162296594323; // 偏心率平方
    
    if (isOutOfChina(lng, lat)) {
        return [lng, lat];
    }
    
    let dLat = transformLat(lng - 105.0, lat - 35.0);
    let dLng = transformLng(lng - 105.0, lat - 35.0);
    
    const radLat = lat / 180.0 * Math.PI;
    let magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    const sqrtMagic = Math.sqrt(magic);
    
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
    dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
    
    return [lng + dLng, lat + dLat];
}

// GCJ-02 到 WGS-84 的转换（国内地图坐标转GPS坐标）
function gcj02ToWgs84(lng, lat) {
    const a = 6378245.0;
    const ee = 0.00669342162296594323;
    
    if (isOutOfChina(lng, lat)) {
        return [lng, lat];
    }
    
    let dLat = transformLat(lng - 105.0, lat - 35.0);
    let dLng = transformLng(lng - 105.0, lat - 35.0);
    
    const radLat = lat / 180.0 * Math.PI;
    let magic = Math.sin(radLat);
    magic = 1 - ee * magic * magic;
    const sqrtMagic = Math.sqrt(magic);
    
    dLat = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
    dLng = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
    
    return [lng - dLng, lat - dLat];
}

// 判断是否在中国境内
function isOutOfChina(lng, lat) {
    return (lng < 72.004 || lng > 137.8347) || (lat < 0.8293 || lat > 55.8271);
}

// 纬度转换
function transformLat(lng, lat) {
    let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lat * Math.PI) + 40.0 * Math.sin(lat / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(lat / 12.0 * Math.PI) + 320 * Math.sin(lat * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret;
}

// 经度转换
function transformLng(lng, lat) {
    let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * Math.PI) + 20.0 * Math.sin(2.0 * lng * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lng * Math.PI) + 40.0 * Math.sin(lng / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(lng / 12.0 * Math.PI) + 300.0 * Math.sin(lng / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret;
}

// 百度坐标系 (BD-09) 到 GCJ-02 的转换
function bd09ToGcj02(lng, lat) {
    const x = lng - 0.0065;
    const y = lat - 0.006;
    const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * Math.PI * 3000.0 / 180.0);
    const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * Math.PI * 3000.0 / 180.0);
    const gcjLng = z * Math.cos(theta);
    const gcjLat = z * Math.sin(theta);
    return [gcjLng, gcjLat];
}

// GCJ-02 到百度坐标系 (BD-09) 的转换
function gcj02ToBd09(lng, lat) {
    const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * Math.PI * 3000.0 / 180.0);
    const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * Math.PI * 3000.0 / 180.0);
    const bdLng = z * Math.cos(theta) + 0.0065;
    const bdLat = z * Math.sin(theta) + 0.006;
    return [bdLng, bdLat];
}

// 根据地图源类型转换坐标
function convertCoordinatesForMapSource(lng, lat, mapSource) {
    switch (mapSource) {
        case 'amap': // 高德地图使用GCJ-02
        case 'tencent': // 腾讯地图使用GCJ-02
            return wgs84ToGcj02(lng, lat);
        case 'baidu': // 百度地图使用BD-09
            const gcj = wgs84ToGcj02(lng, lat);
            return gcj02ToBd09(gcj[0], gcj[1]);
        case 'osm': // OpenStreetMap使用WGS-84
        default:
            return [lng, lat];
    }
}

// 反向转换：从地图坐标转回GPS坐标
function convertCoordinatesFromMapSource(lng, lat, mapSource) {
    switch (mapSource) {
        case 'amap': // 高德地图使用GCJ-02
        case 'tencent': // 腾讯地图使用GCJ-02
            return gcj02ToWgs84(lng, lat);
        case 'baidu': // 百度地图使用BD-09
            const gcj = bd09ToGcj02(lng, lat);
            return gcj02ToWgs84(gcj[0], gcj[1]);
        case 'osm': // OpenStreetMap使用WGS-84
        default:
            return [lng, lat];
    }
}

// 计算两点之间的距离（米）
function calculateDistance(lng1, lat1, lng2, lat2) {
    const R = 6371000; // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        wgs84ToGcj02,
        gcj02ToWgs84,
        bd09ToGcj02,
        gcj02ToBd09,
        convertCoordinatesForMapSource,
        convertCoordinatesFromMapSource,
        calculateDistance
    };
}
