import './CommunityTeaser.css'

type Review = { avatar: string; name: string; text: string; rating: string }

const REVIEWS: Review[] = [
  { avatar: 'J', name: 'J***｜景安和院 住戶', rating: '★★★★★', text: '公設維護得乾淨，假日草皮有人整理。之前反映停車動線，管委會一週內就公告改善。' },
  { avatar: 'W', name: 'W***｜松濤苑 住戶', rating: '★★★★☆', text: '住起來整體舒服，但臨路面向在上下班尖峰車聲明顯，喜靜者建議考慮中高樓層。' },
  { avatar: 'L', name: 'L***｜遠揚柏悅 住戶', rating: '★★★★☆', text: '頂樓排水設計不錯，颱風天沒有積水。不過垃圾車時間稍晚，偶爾有下水道味。' },
  { avatar: 'A', name: 'A***｜華固名邸 住戶', rating: '★★★★★', text: '管理員很負責，包裹收發與公告都有效率；電梯偶爾故障但維修速度快。' },
  { avatar: 'H', name: 'H***｜寶輝花園廣場 住戶', rating: '★★★☆☆', text: '地下室車位轉彎半徑偏小，新手要多注意；平日夜間社區整體很安靜。' },
  { avatar: 'K', name: 'K***｜潤泰峰匯 住戶', rating: '★★★★☆', text: '採光好、通風佳，夏天不會太悶熱；但西曬戶下午還是會稍微熱一些。' }
]

const TAG_SEEDS: { [k: string]: string[] } = {
  '#噪音': ['噪音', '吵', '施工', '臨路', '樓上', '震動', '管道間', '夜間', '喧嘩'],
  '#氣味/菸味': ['菸味', '油煙', '臭', '異味', '下水道', '潮味', '煙味'],
  '#採光/日照': ['採光', '通風', '西曬', '陰暗', '潮濕', '日照', '太熱', '悶'],
  '#物業/管理': ['管理員', '管委會', '警衛', '收發', '態度', '效率', '管理費', '公告'],
  '#漏水/壁癌': ['漏水', '滲水', '壁癌', '發霉', '霉味', '修繕', '維修', '潮濕斑點', '排水'],
  '#停車/車位': ['車位', '機械車位', '平面車位', '坡道', 'B1', 'B2', '格', '好停', '難停', '停車']
}
const FALLBACK_TAG = '#一般'

function normalize(t: string) {
  const toHalf = (s: string) => s.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).replace(/\u3000/g, ' ')
  return toHalf(t || '')
    .toLowerCase()
    .replace(/[~`!@#$%^&*()_+\-={}\[\]|\\:;"'<>?,.，。！？、／]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
function strongScore(text: string, words: string[]) {
  let score = 0
  const sentences = text.split(/[。.!?？]/)
  words.forEach((w) => {
    if (text.includes(w)) score += 1
  })
  sentences.forEach((s) => {
    let hit = 0
    words.forEach((w) => {
      if (s.includes(w)) hit += 1
    })
    if (hit >= 2) score += 1
  })
  return score
}
function weakSimilarity(text: string, words: string[]) {
  let hit = 0
  words.forEach((w) => {
    if (text.includes(w)) hit += 1
  })
  return hit / Math.max(1, words.length)
}
function suggestTags(raw: string) {
  const text = normalize(raw)
  if (text.length < 2) return [FALLBACK_TAG]

  const strong: { tag: string; s: number }[] = []
  Object.entries(TAG_SEEDS).forEach(([tag, words]) => {
    const s = strongScore(text, words)
    if (s >= 2) strong.push({ tag, s })
  })
  strong.sort((a, b) => b.s - a.s)
  let final = strong.slice(0, 2).map((x) => x.tag)

  if (final.length === 0) {
    let best: { tag: string | null; sim: number } = { tag: null, sim: -1 }
    Object.entries(TAG_SEEDS).forEach(([tag, words]) => {
      const sim = weakSimilarity(text, words)
      if (sim > best.sim) best = { tag, sim }
    })
    if (best.tag) final = [best.tag]
  }
  if (final.length === 0) final = [FALLBACK_TAG]
  if (final.length === 1 && final[0] !== FALLBACK_TAG) {
    const key: string = final[0] as string
    const seed: string[] | undefined = (TAG_SEEDS as Record<string, string[]>)[key]
    if (Array.isArray(seed)) {
      const sim = weakSimilarity(text, seed)
      if (sim < 0.05) final = [FALLBACK_TAG]
    }
  }
  return final
}

export default function CommunityTeaser() {
  return (
    <div className="community-aggregate">
      <div className="header"><h3 className="title">社區評價（聚合）</h3></div>
      <div className="grid">
        {REVIEWS.map((r, i) => {
          const tags = suggestTags(r.text)
          return (
            <article key={i} className="review">
              <div className="av2">{r.avatar}</div>
              <div>
                <div className="name">
                  {r.name} <span className="rating"><span className="star">{r.rating}</span></span>
                </div>
                <div className="tags">
                  {tags.map((t) => (
                    <span key={t} className={`tag${t === FALLBACK_TAG ? ' fallback' : ''}`}>{t}</span>
                  ))}
                </div>
                <p>{r.text}</p>
              </div>
            </article>
          )
        })}
      </div>
      <a className="cta" href="#" aria-label="點我看更多社區評價">
        <span className="text">👉 點我看更多社區評價</span>
        <span className="pill">前往社區牆</span>
      </a>
    </div>
  )
}
