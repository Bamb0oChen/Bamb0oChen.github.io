# 浠?Flask 鍔ㄦ€佸簲鐢ㄨ浆鎹负绾潤鎬?HTML 鐨勫彉鏇磋鏄?

## 姒傝堪
灏嗗師鏈夌殑 Flask 鍚庣搴旂敤瀹屽叏杞崲涓虹函 HTML/CSS/JavaScript 闈欐€佺綉椤碉紝鏀寔鍦?GitHub Pages 涓婇儴缃层€傛墍鏈夊姛鑳戒繚鐣欙紝浣跨敤娴忚鍣?LocalStorage 浠ｆ浛鏈嶅姟鍣ㄥ瓨鍌ㄣ€?

---

## 涓昏鍙樻洿

### 1. 绉婚櫎鐨勬枃浠?
- **app.py** - Flask 涓诲簲鐢ㄦ枃浠讹紙涓嶅啀闇€瑕侊級
- **templates/** 鏂囦欢澶?- 鎵€鏈?Jinja2 妯℃澘鏂囦欢
  - templates/base.html
  - templates/index.html  
  - templates/records.html

### 2. 鏂板鏂囦欢
- **index.html** - 棣栭〉锛堝師 templates/index.html锛岃浆鎹负闈欐€?HTML锛?
- **records.html** - 璁板綍椤甸潰锛堝師 templates/records.html锛岃浆鎹负闈欐€?HTML锛?
- **src/data/siteData.js** - 鍏ㄦ柊鐨勬暟鎹鐞嗘ā鍧楋紙LocalStorage 灏佽锛?
- **QUICKSTART.md** - 蹇€熷紑濮嬫寚鍗?
- **.gitignore** - Git 蹇界暐閰嶇疆锛堟洿鏂扮増鏈級

### 3. 淇敼鐨勬枃浠?
- **README.md** - 鏇存柊涓虹函闈欐€佺増鏈殑璇存槑鏂囨。
- **static/styles.css** - 鏃?Flask 渚濊禆锛屽唴瀹逛笉鍙?

### 4. 淇濈暀鐨勬枃浠?
- **static/fade.js** - 婊氬姩鍔ㄧ敾锛堟棤闇€淇敼锛?
- **static/hero.jpg** - 鑻遍泟鍖哄煙鑳屾櫙鍥撅紙鏃犻渶淇敼锛?

---

## 鎶€鏈浆鎹㈣瑙?

### Flask 妯℃澘璇硶 鈫?绾?HTML
**杞崲鍓?*锛?
{% raw %}
```html
{% extends "base.html" %}
{% block title %}棣栭〉{% endblock %}
{% block content %}
<link rel="stylesheet" href="{{ url_for('static', filename='styles.css') }}?v={{ v }}">
```
{% endraw %}

**杞崲鍚?*锛?
```html
<!DOCTYPE html>
<html lang="zh">
<head>
    <link rel="stylesheet" href="static/styles.css">
</head>
```

### API 璋冪敤 鈫?LocalStorage
**杞崲鍓?*锛團lask 鍚庣锛夛細
```javascript
// 鑾峰彇鐑浘鏁版嵁
fetch('/api/heatmap')
    .then(r => r.json())
    .then(counts => { /* 澶勭悊鏁版嵁 */ })

// 淇濆瓨璁板綍
fetch(`/api/record/${dateStr}`, {
    method: 'POST',
    body: JSON.stringify(data)
})
```

**杞崲鍚?*锛圠ocalStorage锛夛細
```javascript
// 鐩存帴浠庢祻瑙堝櫒瀛樺偍鑾峰彇
const counts = getHeatmapData();

// 鐩存帴淇濆瓨鍒版祻瑙堝櫒瀛樺偍
saveRecordData(dateStr, data);
```

### 鏂囦欢瀛樺偍 鈫?LocalStorage
**杞崲鍓?*锛?
```python
# Flask: records/{date}.json
def save_record(date_str, data):
    with open(f"records/{date_str}.json", 'w') as f:
        json.dump(data, f)
```

**杞崲鍚?*锛?
```javascript
// LocalStorage: daily_record_{date}
function saveRecordData(dateStr, data) {
    localStorage.setItem('daily_record_' + dateStr, JSON.stringify(data));
}
```

### 鏂囦欢瀵煎嚭 鈫?Blob + 涓嬭浇閾炬帴
**杞崲鍓?*锛團lask 鍙戦€佹枃浠讹級锛?
```python
return send_file(StringIO(text_content), as_attachment=True)
```

**杞崲鍚?*锛圝avaScript Blob锛夛細
```javascript
const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `record_${dateStr}.txt`;
link.click();
```

---

## 鍔熻兘瀵瑰簲琛?

| 鍔熻兘 | 鍘熷疄鐜?| 鏂板疄鐜?| 鐘舵€?|
|------|-------|-------|------|
| 棣栭〉灞曠ず | Flask render_template | 鐩存帴 HTML | 鉁?瀹屽叏淇濈暀 |
| 鎵撳崱鐑浘 | `/api/heatmap` API | `getHeatmapData()` | 鉁?瀹屽叏淇濈暀 |
| 蹇€熷鑸?| LocalStorage (宸叉湁) | `getQuickNav()` | 鉁?瀹屽叏淇濈暀 |
| 鏃ユ湡瀵艰埅 | N/A | 绾?JavaScript | 鉁?瀹屽叏淇濈暀 |
| 璁板綍淇濆瓨 | `/api/record/<date>` POST | `saveRecordData()` | 鉁?瀹屽叏淇濈暀 |
| 璁板綍鍔犺浇 | `/api/record/<date>` GET | `getRecord()` | 鉁?瀹屽叏淇濈暀 |
| 鍏抽敭璇嶇鐞?| 鍔ㄦ€佹搷浣?| DOM + LocalStorage | 鉁?瀹屽叏淇濈暀 |
| 寰呭姙娓呭崟 | 鍔ㄦ€佹搷浣?| DOM + LocalStorage | 鉁?瀹屽叏淇濈暀 |
| AI 寤鸿 | 鍓嶇閫昏緫 | 鍓嶇閫昏緫 | 鉁?瀹屽叏淇濈暀 |
| 涓撴敞妯″紡 | 鍓嶇閫昏緫 | 鍓嶇閫昏緫 | 鉁?瀹屽叏淇濈暀 |
| 璁板綍瀵煎嚭 | Flask `send_file` | JavaScript Blob | 鉁?瀹屽叏淇濈暀 |

---

## LocalStorage 鏁版嵁缁撴瀯

### 璁板綍鏁版嵁
**閿悕**锛歚daily_record_YYYY-MM-DD`

**鍊肩粨鏋?*锛?
```json
{
  "date": "2024-02-05",
  "keywords": ["宸ヤ綔", "瀛︿範"],
  "today_done": "瀹屾垚浜嗛」鐩?A 鐨勫紑鍙?,
  "tomorrow_plan": ["澶嶅浠ｇ爜", "鍑嗗鏄庡ぉ鐨勪細璁?],
  "insights": "浠婂ぉ鏁堢巼寰堥珮锛屽鍒颁簡寰堝",
  "todos": [
    {"text": "鎻愪氦鎶ュ憡", "completed": true},
    {"text": "鍥炲閭欢", "completed": false}
  ]
}
```

### 蹇€熷鑸暟鎹?
**閿悕**锛歚quicknav_links_v1`

**鍊肩粨鏋?*锛?
```json
[
  {
    "url": "https://github.com",
    "title": "GitHub",
    "icon": "https://www.google.com/s2/favicons?sz=64&domain_url=..."
  }
]
```

---

## 鎬ц兘涓庨檺鍒?

### 瀛樺偍瀹归噺
- **LocalStorage 闄愬埗**锛氶€氬父 5-10MB锛堝彇鍐充簬娴忚鍣級
- **鐞嗚瀹归噺**锛氱害 10,000+ 鏉′腑绛夎妯¤褰?
- **瀹為檯瀹归噺**锛氳冻澶熸棩甯镐娇鐢?

### 璺ㄦ祻瑙堝櫒/璺ㄨ澶?
- 鈿狅笍 鏁版嵁浠呭湪褰撳墠娴忚鍣ㄤ腑淇濆瓨
- 鈿狅笍 涓嶅悓娴忚鍣ㄤ箣闂翠笉鍏变韩鏁版嵁
- 馃挕 瑙ｅ喅鏂规锛氬畾鏈熷鍑哄浠?JSON 鏂囦欢

### 闅愮妯″紡
- 鈿狅笍 闅愮/鏃犵棔妯″紡涓嬶紝LocalStorage 閫氬父涓嶆寔涔呭寲
- 馃挕 寤鸿鍦ㄦ甯告ā寮忎笅浣跨敤

---

## 閮ㄧ讲妫€鏌ユ竻鍗?

- [x] 绉婚櫎鎵€鏈?Flask 渚濊禆
- [x] 杞崲妯℃澘涓虹函 HTML
- [x] 瀹炵幇 LocalStorage 鏁版嵁绠＄悊
- [x] 楠岃瘉鎵€鏈夊唴閮ㄩ摼鎺ワ紙鐩稿璺緞锛?
- [x] 娴嬭瘯鎵€鏈変氦浜掑姛鑳?
- [x] 鏇存柊鏂囨。璇存槑
- [x] 鍒涘缓蹇€熷紑濮嬫寚鍗?
- [x] 鍒涘缓 .gitignore 鏂囦欢
- [ ] 娴嬭瘯 GitHub Pages 閮ㄧ讲锛堝緟鐢ㄦ埛瀹屾垚锛?

---

## 鍗囩骇鍚庣殑浼樺娍

### 鉁?浼樺娍
1. **鏃犻渶鏈嶅姟鍣?* - 绾潤鎬佹枃浠讹紝鍙湪 GitHub Pages 鍏嶈垂閮ㄧ讲
2. **鏇村揩閫熷害** - 鏃犵綉缁滆姹傚欢杩燂紝鐩存帴浣跨敤鏈湴瀛樺偍
3. **瀹屽叏闅愮** - 鎵€鏈夋暟鎹粎淇濆瓨鍦ㄦ湰鍦版祻瑙堝櫒
4. **鏄撲簬缁存姢** - 涓嶉渶瑕?Python/Flask 鐜
5. **鏇村ソ鐨勭绾夸綋楠?* - 鍙互瀹屽叏绂荤嚎浣跨敤

### 鈿狅笍 娉ㄦ剰浜嬮」
1. **涓嶆敮鎸佽法璁惧鍚屾** - 闇€瑕佹墜鍔ㄥ鍏?瀵煎嚭
2. **娴忚鍣ㄩ檺鍒?* - LocalStorage 鏈夊閲忛檺鍒?
3. **闅愮妯″紡鏃犳寔涔呭寲** - 闅愮妯″紡涓嬫暟鎹笉淇濆瓨
4. **涓嶆敮鎸佸鐢ㄦ埛** - 鏈満鍙湁涓€涓敤鎴风殑鏁版嵁

---

## 甯歌杩佺Щ闂

### Q: 鍘熸湁鐨勬暟鎹€庝箞鍔烇紵
**A**: 鍘熸暟鎹湪 Flask 搴旂敤鐨?`records/` 鏂囦欢澶逛腑锛?
1. 闇€瑕佹墜鍔ㄨ浆鎹负 LocalStorage 鏍煎紡
2. 鎴栬仈绯诲紑鍙戣€呰繘琛屾暟鎹縼绉昏剼鏈?

### Q: 鑳藉洖鍒?Flask 鐗堟湰鍚楋紵
**A**: 鍙互锛屼絾闇€瑕侊細
1. 淇濈暀鍘?Flask 浠ｇ爜鐨勫浠?
2. 閫氳繃 Git 鍘嗗彶鎭㈠鎴栧垱寤烘柊鍒嗘敮

### Q: 鑳藉悓鏃惰繍琛屼袱涓増鏈悧锛?
**A**: 鍙互锛?
1. Flask 鐗堟湰鍦ㄦ湰鍦?鑷湁鏈嶅姟鍣ㄨ繍琛?
2. 闈欐€佺増鏈湪 GitHub Pages 閮ㄧ讲
3. 鍚勮嚜缁存姢鐙珛鐨勬暟鎹?

---

## 鏈潵澧炲己寤鸿

1. **浜戝悓姝?* - 闆嗘垚 Firebase/AWS 瀹炵幇璺ㄨ澶囧悓姝?
2. **楂樼骇鍒嗘瀽** - 娣诲姞璁板綍缁熻鍜屾暟鎹彲瑙嗗寲
3. **涓婚鍒囨崲** - 瀹炵幇娣辫壊/娴呰壊涓婚
4. **PWA 鏀寔** - 绂荤嚎浣跨敤鍜屽簲鐢ㄥ寲
5. **瀵煎叆瀵煎嚭 UI** - 鍦ㄩ〉闈腑娣诲姞澶囦唤/鎭㈠鎸夐挳
6. **鏁版嵁鍔犲瘑** - 澧炲己鏈湴鏁版嵁瀹夊叏鎬?

---

**杞崲瀹屾垚鏃ユ湡**锛?026 骞?2 鏈?5 鏃?

鎵€鏈夊姛鑳藉凡楠岃瘉锛屽彲浠ュ紑濮嬩娇鐢紒馃帀

