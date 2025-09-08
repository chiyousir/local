// 国内可访问的地图瓦片源配置
const ChinaMapSources = {
    // 高德地图
    amap: {
        name: '高德地图',
        url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        subdomains: ['1', '2', '3', '4'],
        attribution: '© 高德地图',
        maxZoom: 18
    },
    
    // 百度地图
    baidu: {
        name: '百度地图',
        url: 'https://maponline{s}.bdimg.com/tile/?qt=vtile&x={x}&y={y}&z={z}&styles=pl&scaler=1&udt=20200101',
        subdomains: ['0', '1', '2', '3'],
        attribution: '© 百度地图',
        maxZoom: 18
    },
    
    // 腾讯地图
    tencent: {
        name: '腾讯地图',
        url: 'https://rt{s}.map.gtimg.com/tile?z={z}&x={x}&y={y}&type=vector&styleid=3',
        subdomains: ['0', '1', '2', '3'],
        attribution: '© 腾讯地图',
        maxZoom: 18
    },
    
    // 天地图
    tianditu: {
        name: '天地图',
        url: 'https://t{s}.tianditu.gov.cn/vec_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=您的天地图密钥',
        subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
        attribution: '© 天地图',
        maxZoom: 18
    },
    
    // OpenStreetMap (备用)
    osm: {
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c'],
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }
};

// 创建地图瓦片层的函数
function createTileLayer(sourceKey) {
    const source = ChinaMapSources[sourceKey];
    if (!source) {
        throw new Error(`未知的地图源: ${sourceKey}`);
    }
    
    return L.tileLayer(source.url, {
        attribution: source.attribution,
        maxZoom: source.maxZoom,
        subdomains: source.subdomains
    });
}

// 获取地图源使用的坐标系
function getMapSourceCoordinateSystem(sourceKey) {
    const coordinateSystems = {
        'amap': 'GCJ-02',
        'baidu': 'BD-09', 
        'tencent': 'GCJ-02',
        'osm': 'WGS-84'
    };
    return coordinateSystems[sourceKey] || 'WGS-84';
}

// 尝试创建地图，使用多个备用源
function createMapWithFallback(containerId, options = {}) {
    const defaultOptions = {
        center: [39.9042, 116.4074], // 北京
        zoom: 10,
        fallbackSources: ['amap', 'baidu', 'tencent', 'osm']
    };
    
    const config = { ...defaultOptions, ...options };
    
    // 创建地图实例
    const map = L.map(containerId, {
        center: config.center,
        zoom: config.zoom
    });
    
    let tileLayer = null;
    let successSource = null;
    
    // 尝试每个地图源
    for (const sourceKey of config.fallbackSources) {
        try {
            tileLayer = createTileLayer(sourceKey);
            tileLayer.addTo(map);
            successSource = sourceKey;
            console.log(`成功使用地图源: ${ChinaMapSources[sourceKey].name}`);
            break;
        } catch (error) {
            console.warn(`地图源 ${sourceKey} 加载失败:`, error);
            if (tileLayer) {
                map.removeLayer(tileLayer);
            }
        }
    }
    
    if (!tileLayer) {
        throw new Error('所有地图源都加载失败');
    }
    
    return {
        map: map,
        tileLayer: tileLayer,
        source: successSource,
        sourceName: ChinaMapSources[successSource].name,
        coordinateSystem: getMapSourceCoordinateSystem(successSource)
    };
}

// 测试地图源连接性
async function testMapSource(sourceKey) {
    const source = ChinaMapSources[sourceKey];
    if (!source) {
        return { success: false, error: `未知的地图源: ${sourceKey}` };
    }
    
    return new Promise((resolve) => {
        const img = new Image();
        const testUrl = source.url
            .replace('{s}', source.subdomains[0])
            .replace('{z}', '10')
            .replace('{x}', '512')
            .replace('{y}', '512');
        
        img.onload = () => {
            resolve({ 
                success: true, 
                source: sourceKey, 
                name: source.name,
                url: testUrl 
            });
        };
        
        img.onerror = () => {
            resolve({ 
                success: false, 
                source: sourceKey, 
                name: source.name,
                error: '连接失败' 
            });
        };
        
        img.src = testUrl;
    });
}

// 测试所有地图源
async function testAllMapSources() {
    const results = [];
    const sources = Object.keys(ChinaMapSources);
    
    for (const sourceKey of sources) {
        const result = await testMapSource(sourceKey);
        results.push(result);
    }
    
    return results;
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ChinaMapSources,
        createTileLayer,
        createMapWithFallback,
        testMapSource,
        testAllMapSources
    };
}
