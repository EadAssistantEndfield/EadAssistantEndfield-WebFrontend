#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从 GameKee 网站获取明日方舟终末地基建设备数据
按照回血类、充能类、加攻类、防御类、特殊效果等分类保存
"""

import json
import os
import requests
import time
from pathlib import Path

# 分类 ID 映射 (从 API 响应中获取)
CATEGORY_MAP = {
    '13406': '回血类',
    '13409': '充能类',
    '13408': '加攻类',
    '13407': '防御类',
    '13410': '特殊效果'
}

# 品质 ID 映射
QUALITY_MAP = {
    '13402': '金',
    '13403': '紫',
    '13404': '蓝',
    '13405': '绿'
}

# 从页面获取的设备数据
DEVICES_DATA = [
    {"name":"水驱矿机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_141/h_145/50248/103682/2026/2/13/346480.png","href":"https://www.gamekee.com/zmd/697595.html"},
    {"name":"激流塔","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_138/h_143/50248/103682/2026/2/13/671583.png","href":"https://www.gamekee.com/zmd/697596.html"},
    {"name":"AF1 熔甲者","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_139/h_143/50248/103682/2026/2/13/925996.png","href":"https://www.gamekee.com/zmd/697597.html"},
    {"name":"废水处理机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_140/h_143/50248/103682/2026/2/13/439418.png","href":"https://www.gamekee.com/zmd/697598.html"},
    {"name":"暗管出口","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_142/h_143/50248/103682/2026/2/13/14744.png","href":"https://www.gamekee.com/zmd/697599.html"},
    {"name":"暗管入口","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_139/h_144/50248/103682/2026/2/13/893476.png","href":"https://www.gamekee.com/zmd/697600.html"},
    {"name":"便携源石矿机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_188/h_192/50248/103682/2026/0/17/30892.png","href":"https://www.gamekee.com/zmd/690574.html"},
    {"name":"电驱矿机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_190/h_192/50248/103682/2026/0/17/437421.png","href":"https://www.gamekee.com/zmd/690431.html"},
    {"name":"二型电驱矿机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_184/h_189/50248/103682/2026/0/17/975400.png","href":"https://www.gamekee.com/zmd/690571.html"},
    {"name":"水泵","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_190/h_191/50248/103682/2026/0/17/652641.png","href":"https://www.gamekee.com/zmd/690576.html"},
    {"name":"物品准入口","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_191/h_190/50248/103682/2026/0/17/721302.png","href":"https://www.gamekee.com/zmd/690581.html"},
    {"name":"分流器","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_188/h_193/50248/103682/2026/0/17/271924.png","href":"https://www.gamekee.com/zmd/690588.html"},
    {"name":"物流桥","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_189/h_189/50248/103682/2026/0/17/409584.png","href":"https://www.gamekee.com/zmd/690608.html"},
    {"name":"汇流器","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_187/h_189/50248/103682/2026/0/17/979414.png","href":"https://www.gamekee.com/zmd/690611.html"},
    {"name":"管道准入口","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_187/h_190/50248/103682/2026/0/17/673206.png","href":"https://www.gamekee.com/zmd/690612.html"},
    {"name":"管道分流器","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_189/h_191/50248/103682/2026/0/17/264878.png","href":"https://www.gamekee.com/zmd/690614.html"},
    {"name":"管道桥","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_189/h_191/50248/103682/2026/0/17/991989.png","href":"https://www.gamekee.com/zmd/690615.html"},
    {"name":"管道汇流器","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_187/h_190/50248/103682/2026/0/17/336040.png","href":"https://www.gamekee.com/zmd/690616.html"},
    {"name":"协议储存箱","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_188/h_194/50248/103682/2026/0/17/444299.png","href":"https://www.gamekee.com/zmd/690851.html"},
    {"name":"仓库存货口","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_183/h_191/50248/103682/2026/0/17/927678.png","href":"https://www.gamekee.com/zmd/690853.html"},
    {"name":"仓库取货口","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_189/h_191/50248/103682/2026/0/17/526577.png","href":"https://www.gamekee.com/zmd/690854.html"},
    {"name":"储液罐","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_189/h_192/50248/103682/2026/0/17/667735.png","href":"https://www.gamekee.com/zmd/692081.html"},
    {"name":"仓库存取线基段","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_184/h_192/50248/103682/2026/0/17/310350.png","href":"https://www.gamekee.com/zmd/692084.html"},
    {"name":"仓库存取线源桩","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_186/h_193/50248/103682/2026/0/17/918104.png","href":"https://www.gamekee.com/zmd/692085.html"},
    {"name":"精炼炉","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_181/h_193/50248/103682/2026/0/17/982408.png","href":"https://www.gamekee.com/zmd/690424.html"},
    {"name":"粉碎机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_187/h_193/50248/103682/2026/0/17/192733.png","href":"https://www.gamekee.com/zmd/690430.html"},
    {"name":"配件机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_186/h_192/50248/103682/2026/0/17/842815.png","href":"https://www.gamekee.com/zmd/692088.html"},
    {"name":"塑形机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_187/h_194/50248/103682/2026/0/17/138492.png","href":"https://www.gamekee.com/zmd/692089.html"},
    {"name":"种植机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_184/h_192/50248/103682/2026/0/17/761591.png","href":"https://www.gamekee.com/zmd/692090.html"},
    {"name":"采种机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_185/h_187/50248/103682/2026/0/17/819460.png","href":"https://www.gamekee.com/zmd/692092.html"},
    {"name":"装备原件机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_184/h_190/50248/103682/2026/0/17/765616.png","href":"https://www.gamekee.com/zmd/692032.html"},
    {"name":"灌装机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_190/h_192/50248/103682/2026/0/17/87454.png","href":"https://www.gamekee.com/zmd/692094.html"},
    {"name":"封装机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_186/h_193/50248/103682/2026/0/17/929000.png","href":"https://www.gamekee.com/zmd/692095.html"},
    {"name":"研磨机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_183/h_190/50248/103682/2026/0/17/330303.png","href":"https://www.gamekee.com/zmd/692097.html"},
    {"name":"反应池","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_184/h_191/50248/103682/2026/0/17/300850.png","href":"https://www.gamekee.com/zmd/692098.html"},
    {"name":"天有烘炉","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_180/h_192/50248/103682/2026/0/17/754168.png","href":"https://www.gamekee.com/zmd/692099.html"},
    {"name":"拆解机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_185/h_191/50248/103682/2026/0/17/163561.png","href":"https://www.gamekee.com/zmd/692101.html"},
    {"name":"供电桩","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_187/h_191/50248/103682/2026/0/17/932915.png","href":"https://www.gamekee.com/zmd/692037.html"},
    {"name":"息壤供电桩","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_187/h_192/50248/103682/2026/0/17/524972.png","href":"https://www.gamekee.com/zmd/692112.html"},
    {"name":"中继器","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_186/h_193/50248/103682/2026/0/17/73239.png","href":"https://www.gamekee.com/zmd/692113.html"},
    {"name":"息壤中继器","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_187/h_194/50248/103682/2026/0/17/590200.png","href":"https://www.gamekee.com/zmd/692114.html"},
    {"name":"热能池","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_189/h_191/50248/103682/2026/0/17/990125.png","href":"https://www.gamekee.com/zmd/692116.html"},
    {"name":"便携存取站","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_185/h_191/50248/103682/2026/0/17/525321.png","href":"https://www.gamekee.com/zmd/692038.html"},
    {"name":"留言信标","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_186/h_194/50248/103682/2026/0/17/736790.png","href":"https://www.gamekee.com/zmd/692117.html"},
    {"name":"滑索架","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_189/h_192/50248/103682/2026/0/17/561576.png","href":"https://www.gamekee.com/zmd/692118.html"},
    {"name":"长距滑索架","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_184/h_192/50248/103682/2026/0/17/422258.png","href":"https://www.gamekee.com/zmd/692119.html"},
    {"name":"洒水机","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_188/h_191/50248/103682/2026/0/17/839156.png","href":"https://www.gamekee.com/zmd/692120.html"},
    {"name":"给水器","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_184/h_188/50248/103682/2026/0/17/799543.png","href":"https://www.gamekee.com/zmd/692121.html"},
    {"name":"铳械塔","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_187/h_194/50248/103682/2026/0/17/193839.png","href":"https://www.gamekee.com/zmd/692040.html"},
    {"name":"医疗塔","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_186/h_190/50248/103682/2026/0/17/6165.png","href":"https://www.gamekee.com/zmd/692123.html"},
    {"name":"榴弹塔","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_189/h_193/50248/103682/2026/0/17/714730.png","href":"https://www.gamekee.com/zmd/692124.html"},
    {"name":"液氮塔","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_187/h_194/50248/103682/2026/0/17/999040.png","href":"https://www.gamekee.com/zmd/692125.html"},
    {"name":"扩装铳械塔","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_186/h_190/50248/103682/2026/0/17/913047.png","href":"https://www.gamekee.com/zmd/692126.html"},
    {"name":"全向声波塔","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_184/h_190/50248/103682/2026/0/17/993453.png","href":"https://www.gamekee.com/zmd/692127.html"},
    {"name":"射线塔","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_184/h_192/50248/103682/2026/0/17/877866.png","href":"https://www.gamekee.com/zmd/692128.html"},
    {"name":"电涌塔","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_183/h_192/50248/103682/2026/0/17/614527.png","href":"https://www.gamekee.com/zmd/692129.html"},
    {"name":"哨戒塔","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_183/h_192/50248/103682/2026/0/17/230177.png","href":"https://www.gamekee.com/zmd/692130.html"},
    {"name":"高爆榴弹塔","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_185/h_192/50248/103682/2026/0/17/558894.png","href":"https://www.gamekee.com/zmd/692131.html"},
    {"name":"毒沼 MK-I","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_183/h_191/50248/103682/2026/0/17/101381.png","href":"https://www.gamekee.com/zmd/692132.html"},
    {"name":"荞花田块","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_189/h_192/50248/103682/2026/0/17/761179.png","href":"https://www.gamekee.com/zmd/692042.html"},
    {"name":"柑实田块","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_185/h_190/50248/103682/2026/0/17/163123.png","href":"https://www.gamekee.com/zmd/692133.html"},
    {"name":"砂叶田块","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_185/h_190/50248/103682/2026/0/17/725317.png","href":"https://www.gamekee.com/zmd/692136.html"},
    {"name":"酮化灌木田块","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_188/h_194/50248/103682/2026/0/17/592639.png","href":"https://www.gamekee.com/zmd/692137.html"},
    {"name":"锦草田块","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_186/h_192/50248/103682/2026/0/17/582451.png","href":"https://www.gamekee.com/zmd/692138.html"},
    {"name":"芽针田块","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_185/h_190/50248/103682/2026/0/17/981637.png","href":"https://www.gamekee.com/zmd/692139.html"},
    {"name":"灰芦麦田块","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_185/h_190/50248/103682/2026/0/17/798159.png","href":"https://www.gamekee.com/zmd/692140.html"},
    {"name":"苦叶椒田块","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_185/h_190/50248/103682/2026/0/17/953263.png","href":"https://www.gamekee.com/zmd/692141.html"},
    {"name":"琼叶参田块","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_182/h_191/50248/103682/2026/0/17/130257.png","href":"https://www.gamekee.com/zmd/692142.html"},
    {"name":"金石稻田块","imgSrc":"https://cdnimg-v2.gamekee.com/wiki2.0/images/w_186/h_192/50248/103682/2026/0/17/268769.png","href":"https://www.gamekee.com/zmd/692143.html"},
]

# 从 API 获取的设备 - 分类映射
# 根据 entry_filter_attr 中的数据，将设备 ID 映射到分类
DEVICE_CATEGORY_MAPPING = {
    # 回血类 (13406) - 大部分绿品质设备
    "203368": {"quality": "绿", "category": "回血类"},
    "203369": {"quality": "绿", "category": "回血类"},
    "203370": {"quality": "绿", "category": "回血类"},
    "203371": {"quality": "绿", "category": "回血类"},
    "203372": {"quality": "蓝", "category": "回血类"},
    "203373": {"quality": "蓝", "category": "回血类"},
    "203374": {"quality": "蓝", "category": "回血类"},
    "203375": {"quality": "蓝", "category": "回血类"},
    "203376": {"quality": "蓝", "category": "回血类"},
    "203377": {"quality": "蓝", "category": "回血类"},
    "203378": {"quality": "蓝", "category": "回血类"},
    "203379": {"quality": "蓝", "category": "回血类"},
    "203380": {"quality": "蓝", "category": "回血类"},
    "203381": {"quality": "蓝", "category": "回血类"},
    "203382": {"quality": "紫", "category": "回血类"},
    "203383": {"quality": "紫", "category": "回血类"},
    "203384": {"quality": "紫", "category": "回血类"},
    "203385": {"quality": "紫", "category": "回血类"},
    "203386": {"quality": "紫", "category": "回血类"},
    "203387": {"quality": "紫", "category": "回血类"},
    "203388": {"quality": "紫", "category": "回血类"},
    "203389": {"quality": "金", "category": "回血类"},
    "203390": {"quality": "金", "category": "回血类"},
    "203391": {"quality": "金", "category": "回血类"},
    "203392": {"quality": "金", "category": "回血类"},
    "203393": {"quality": "金", "category": "回血类"},
    "203399": {"quality": "绿", "category": "回血类"},
    "203402": {"quality": "绿", "category": "回血类"},
    "203407": {"quality": "蓝", "category": "回血类"},
    "203411": {"quality": "蓝", "category": "回血类"},
    "203415": {"quality": "蓝", "category": "回血类"},
    "203417": {"quality": "紫", "category": "回血类"},
    "203419": {"quality": "紫", "category": "回血类"},
    "203420": {"quality": "紫", "category": "回血类"},
    "203421": {"quality": "紫", "category": "回血类"},
    "203422": {"quality": "紫", "category": "回血类"},
    "203423": {"quality": "紫", "category": "回血类"},
    "203427": {"quality": "金", "category": "回血类"},
    "203428": {"quality": "金", "category": "回血类"},
    "204509": {"quality": "紫", "category": "回血类"},
    "210783": {"quality": "紫", "category": "回血类"},
    "210797": {"quality": "紫", "category": "回血类"},
    "210798": {"quality": "紫", "category": "回血类"},

    # 充能类 (13409)
    "203396": {"quality": "紫", "category": "充能类"},
    "203403": {"quality": "绿", "category": "充能类"},
    "203404": {"quality": "绿", "category": "充能类"},
    "204229": {"quality": "蓝", "category": "充能类"},

    # 加攻类 (13408)
    "203395": {"quality": "蓝", "category": "加攻类"},
    "203398": {"quality": "紫", "category": "加攻类"},
    "203405": {"quality": "蓝", "category": "加攻类"},
    "203406": {"quality": "紫", "category": "加攻类"},
    "203408": {"quality": "蓝", "category": "加攻类"},
    "203410": {"quality": "蓝", "category": "加攻类"},
    "203413": {"quality": "蓝", "category": "加攻类"},
    "203418": {"quality": "紫", "category": "加攻类"},
    "203426": {"quality": "紫", "category": "加攻类"},
    "203429": {"quality": "金", "category": "加攻类"},

    # 防御类 (13407)
    "203400": {"quality": "绿", "category": "防御类"},
    "203409": {"quality": "蓝", "category": "防御类"},
    "203412": {"quality": "蓝", "category": "防御类"},
    "203414": {"quality": "蓝", "category": "防御类"},
    "203416": {"quality": "蓝", "category": "防御类"},
    "203424": {"quality": "紫", "category": "防御类"},
    "203425": {"quality": "紫", "category": "防御类"},
    "203430": {"quality": "金", "category": "防御类"},

    # 特殊效果 (13410)
    "203239": {"quality": "蓝", "category": "特殊效果"},
    "203394": {"quality": "蓝", "category": "特殊效果"},
    "203397": {"quality": "紫", "category": "特殊效果"},
    "203401": {"quality": "绿", "category": "特殊效果"},
}

# 基建建筑名称列表（根据图片名称识别）
BUILDING_NAMES = {
    # 回血类建筑
    '医疗塔': '回血类',

    # 充能类建筑
    '供电桩': '充能类',
    '息壤供电桩': '充能类',
    '热能池': '充能类',
    '中继器': '充能类',
    '息壤中继器': '充能类',

    # 加攻类建筑
    '铳械塔': '加攻类',
    '扩装铳械塔': '加攻类',
    '榴弹塔': '加攻类',
    '高爆榴弹塔': '加攻类',

    # 防御类建筑
    '哨戒塔': '防御类',
    '液氮塔': '防御类',
    '射线塔': '防御类',
    '电涌塔': '防御类',
    '全向声波塔': '防御类',
    '毒沼 MK-I': '防御类',

    # 特殊效果建筑
    '激流塔': '特殊效果',
    'AF1 熔甲者': '特殊效果',
    '洒水机': '特殊效果',
    '给水器': '特殊效果',
    '滑索架': '特殊效果',
    '长距滑索架': '特殊效果',
    '留言信标': '特殊效果',
    '便携存取站': '特殊效果',
}


def download_image(url, save_path):
    """下载图片到指定路径"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.gamekee.com/'
        }
        response = requests.get(url, headers=headers, timeout=30)
        if response.status_code == 200:
            with open(save_path, 'wb') as f:
                f.write(response.content)
            return True
        else:
            print(f"  下载失败：{url} - 状态码 {response.status_code}")
            return False
    except Exception as e:
        print(f"  下载出错：{url} - {str(e)}")
        return False


def classify_device(device_name):
    """根据设备名称分类"""
    return BUILDING_NAMES.get(device_name, '未分类')


def main():
    # 输出目录
    output_dir = Path(r"D:\Desktop\python\endfield\blueprint_analysis\data\gamekee_buildings")
    output_dir.mkdir(parents=True, exist_ok=True)

    # 创建分类目录
    categories = ['回血类', '充能类', '加攻类', '防御类', '特殊效果', '未分类']
    for cat in categories:
        cat_dir = output_dir / cat
        cat_dir.mkdir(parents=True, exist_ok=True)

    # 分类保存设备数据
    categorized_data = {cat: [] for cat in categories}

    print("开始处理基建设备数据...")

    for device in DEVICES_DATA:
        name = device['name']
        img_src = device['imgSrc']
        href = device['href']

        # 获取分类
        category = classify_device(name)

        # 构建数据对象
        device_data = {
            'name': name,
            'category': category,
            'image_url': img_src,
            'wiki_url': href,
            'image_file': f"{name}.png" if img_src.startswith('http') else None
        }

        # 添加到分类数据
        if category in categorized_data:
            categorized_data[category].append(device_data)

        # 下载图片
        if img_src.startswith('http') and not img_src.startswith('data:'):
            img_path = output_dir / category / f"{name}.png"
            # 清理图片 URL，去除处理参数
            clean_img_src = img_src.split('?')[0]
            print(f"  下载：{name} -> {category}")
            download_image(clean_img_src, img_path)

    # 保存总的 JSON 数据
    all_data = {
        'source': 'GameKee 明日方舟终末地基建攻略',
        'url': 'https://www.gamekee.com/zmd/second/204958',
        'update_time': time.strftime('%Y-%m-%d %H:%M:%S'),
        'categories': categories,
        'data': categorized_data
    }

    output_file = output_dir / 'buildings_data.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"\n数据已保存到：{output_file}")
    print("\n分类统计:")
    for cat in categories:
        print(f"  {cat}: {len(categorized_data[cat])} 个设备")

    total = sum(len(items) for items in categorized_data.values())
    print(f"\n总计：{total} 个设备")


if __name__ == '__main__':
    main()
