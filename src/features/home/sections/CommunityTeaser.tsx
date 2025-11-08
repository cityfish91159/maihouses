import React, { useEffect } from 'react'

// 靜態 HTML 片段（僅 <section> 內容）
const RAW_SECTION = `
<section class="section">
  <div class="header"><h3 class="title">社區評價（聚合）</h3></div>
  <div class="grid">
    <article class="review"><div class="av2">J</div><div><div class="name">J***｜景安和院 住戶 <span class="rating"><span class="star">★★★★★</span></span></div><div class="tags"></div><p>公設維護得乾淨，假日草皮有人整理。之前反映停車動線，管委會一週內就公告改善。</p></div></article>
    <article class="review"><div class="av2">W</div><div><div class="name">W***｜松濤苑 住戶 <span class="rating"><span class="star">★★★★☆</span></span></div><div class="tags"></div><p>住起來整體舒服，但臨路面向在上下班尖峰車聲明顯，喜靜者建議考慮中高樓層。</p></div></article>
    <article class="review"><div class="av2">L</div><div><div class="name">L***｜遠揚柏悅 住戶 <span class="rating"><span class="star">★★★★☆</span></span></div><div class="tags"></div><p>頂樓排水設計不錯，颱風天沒有積水。不過垃圾車時間稍晚，偶爾有下水道味。</p></div></article>
    <article class="review"><div class="av2">A</div><div><div class="name">A***｜華固名邸 住戶 <span class="rating"><span class="star">★★★★★</span></span></div><div class="tags"></div><p>管理員很負責，包裹收發與公告都有效率；電梯偶爾故障但維修速度快。</p></div></article>
    <article class="review"><div class="av2">H</div><div><div class="name">H***｜寶輝花園廣場 住戶 <span class="rating"><span class="star">★★★☆☆</span></span></div><div class="tags"></div><p>地下室車位轉彎半徑偏小，新手要多注意；平日夜間社區整體很安靜。</p></div></article>
    <article class="review"><div class="av2">K</div><div><div class="name">K***｜潤泰峰匯 住戶 <span class="rating"><span class="star">★★★★☆</span></span></div><div class="tags"></div><p>採光好、通風佳，夏天不會太悶熱；但西曬戶下午還是會稍微熱一些。</p></div></article>
  </div>
  <a class="cta" href="#/community/suggested" aria-label="點我看更多社區評價"><span class="text">👉 點我看更多社區評價</span><span class="pill">前往社區牆</span></a>
</section>`

// 綠色標籤邏輯（僅運行於掛載後，直接操作 DOM，不引入外部 script）。
const TAG_SEEDS: Record<string, string[]> = {
  '#噪音': ['噪音','吵','施工','臨路','樓上','震動','管道間','夜間','喧嘩'],
  '#氣味/菸味': ['菸味','油煙','臭','異味','下水道','潮味','煙味'],
  '#採光/日照': ['採光','通風','西曬','陰暗','潮濕','日照','太熱','悶'],
  '#物業/管理': ['管理員','管委會','警衛','收發','態度','效率','管理費','公告'],
  '#漏水/壁癌': ['漏水','滲水','壁癌','發霉','霉味','修繕','維修','潮濕斑點','排水'],
  '#停車/車位': ['車位','機械車位','平面車位','坡道','B1','B2','格','好停','難停','停車']
}
const FALLBACK_TAG = '#一般'

function normalize(t: string){
  const toHalf = (s: string) => s.replace(/[\uFF01-\uFF5E]/g, ch => String.fromCharCode(ch.charCodeAt(0)-0xFEE0)).replace(/\u3000/g,' ')
  return toHalf(t).toLowerCase().replace(/[~`!@#$%^&*()_+\-={}[\]|\\:;"'<>?,.，。！？、／]/g,' ').replace(/\s+/g,' ').trim()
}
function strongScore(text: string, words: string[]){
  let score = 0
  const sentences = text.split(/[。.!?？]/)
  words.forEach(w=>{ if(text.includes(w)) score += 1 })
  sentences.forEach(s=>{
    let hit = 0
    words.forEach(w=>{ if(s.includes(w)) hit += 1 })
    if(hit>=2) score += 1
  })
  return score
}
function weakSimilarity(text: string, words: string[]){
  let hit = 0
  words.forEach(w=>{ if(text.includes(w)) hit += 1 })
  return hit / Math.max(1, words.length)
}
function suggestTags(raw: string){
  const text = normalize(raw)
  if(text.length < 2) return [FALLBACK_TAG]
  const strong: {tag:string;s:number}[] = []
  Object.entries(TAG_SEEDS).forEach(([tag, words])=>{
    const s = strongScore(text, words)
    if(s>=2) strong.push({tag,s})
  })
  strong.sort((a,b)=>b.s-a.s)
  let final = strong.slice(0,2).map(x=>x.tag)
  if(final.length===0){
    let best={tag:null as string|null,sim:-1}
    Object.entries(TAG_SEEDS).forEach(([tag,words])=>{
      const sim = weakSimilarity(text, words)
      if(sim>best.sim) best={tag,sim}
    })
    if(best.tag) final=[best.tag]
  }
  if(final.length===0) final=[FALLBACK_TAG]
  if(final.length===1 && final[0] && final[0]!==FALLBACK_TAG){
    const seed = TAG_SEEDS[final[0]]
    if(seed){
      const sim = weakSimilarity(text, seed)
      if(sim<0.05) final=[FALLBACK_TAG]
    }
  }
  return final
}

function applyTags(container: HTMLElement){
  container.querySelectorAll('.review').forEach(card => {
    const p = card.querySelector('p')
    const text = p ? p.textContent || '' : ''
    let tagBox = card.querySelector('.tags') as HTMLElement | null
    if(!tagBox){
      tagBox = document.createElement('div')
      tagBox.className = 'tags'
      const nameRow = card.querySelector('.name')
      if(nameRow) nameRow.insertAdjacentElement('afterend', tagBox)
      else card.appendChild(tagBox)
    }
    const tags = suggestTags(text)
    tagBox.innerHTML = ''
    tags.forEach(t => {
      const span = document.createElement('span')
      span.className = 'tag' + (t===FALLBACK_TAG ? ' fallback' : '')
      span.textContent = t
      tagBox!.appendChild(span)
    })
  })
}

export default function CommunityTeaser(){
  useEffect(()=>{
    const root = document.querySelector('.community-teaser-html') as HTMLElement | null
    if(root) applyTags(root)
  }, [])

  return (
    <div className="community-teaser-html" dangerouslySetInnerHTML={{ __html: RAW_SECTION }} />
  )
}
