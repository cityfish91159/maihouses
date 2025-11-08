export default function CommunityTeaser() {
  const html = `
<section class="section">
  <div class="header"><h3 class="title">社區評價（聚合）</h3></div>

  <!-- 6 則聚合（兩欄排版 in md+） -->
  <div class="grid">

    <article class="review">
      <div class="av2">J</div>
      <div>
        <div class="name">J***｜景安和院 住戶 <span class="rating"><span class="star">★★★★★</span></span></div>
        <div class="tags"></div>
        <p>公設維護得乾淨，假日草皮有人整理。之前反映停車動線，管委會一週內就公告改善。</p>
      </div>
    </article>

    <article class="review">
      <div class="av2">W</div>
      <div>
        <div class="name">W***｜松濤苑 住戶 <span class="rating"><span class="star">★★★★☆</span></span></div>
        <div class="tags"></div>
        <p>住起來整體舒服，但臨路面向在上下班尖峰車聲明顯，喜靜者建議考慮中高樓層。</p>
      </div>
    </article>

    <article class="review">
      <div class="av2">L</div>
      <div>
        <div class="name">L***｜遠揚柏悅 住戶 <span class="rating"><span class="star">★★★★☆</span></span></div>
        <div class="tags"></div>
        <p>頂樓排水設計不錯，颱風天沒有積水。不過垃圾車時間稍晚，偶爾有下水道味。</p>
      </div>
    </article>

    <article class="review">
      <div class="av2">A</div>
      <div>
        <div class="name">A***｜華固名邸 住戶 <span class="rating"><span class="star">★★★★★</span></span></div>
        <div class="tags"></div>
        <p>管理員很負責，包裹收發與公告都有效率；電梯偶爾故障但維修速度快。</p>
      </div>
    </article>

    <article class="review">
      <div class="av2">H</div>
      <div>
        <div class="name">H***｜寶輝花園廣場 住戶 <span class="rating"><span class="star">★★★☆☆</span></span></div>
        <div class="tags"></div>
        <p>地下室車位轉彎半徑偏小，新手要多注意；平日夜間社區整體很安靜。</p>
      </div>
    </article>

    <article class="review">
      <div class="av2">K</div>
      <div>
        <div class="name">K***｜潤泰峰匯 住戶 <span class="rating"><span class="star">★★★★☆</span></span></div>
        <div class="tags"></div>
        <p>採光好、通風佳，夏天不會太悶熱；但西曬戶下午還是會稍微熱一些。</p>
      </div>
    </article>

  </div>

  <!-- CTA：改為「點我看更多社區評價」，大而醒目 -->
  <a class="cta" href="#" aria-label="點我看更多社區評價">
    <span class="text">👉 點我看更多社區評價</span>
    <span class="pill">前往社區牆</span>
  </a>

</section>
`
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}
