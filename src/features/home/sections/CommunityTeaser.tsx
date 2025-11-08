export default function CommunityTeaser() {
	return (
		<section className="reviews-agg">
			<style>{`
				.reviews-agg{background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border:1px solid #e8f0f8;border-radius:18px;padding:10px}
				.reviews-agg .header{display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:6px}
				.reviews-agg .title{font-size:16px;font-weight:800;margin:0;color:#0d2d8f;letter-spacing:.3px}
				.reviews-agg .grid{display:grid;grid-template-columns:1fr;gap:8px}
				@media(min-width:560px){.reviews-agg .grid{grid-template-columns:1fr 1fr}}
				.reviews-agg .review{display:flex;gap:8px;border:1px solid #e8f0f8;border-radius:13px;padding:7px;background:#fff;position:relative}
				.reviews-agg .av2{width:34px;height:34px;border-radius:50%;background:rgba(230,240,255,.8);border:2px solid #1749d7;display:flex;align-items:center;justify-content:center;font-weight:800;color:#1749d7;font-size:15px;flex-shrink:0}
				.reviews-agg .name{font-weight:800;font-size:12.5px;color:#0a1f3f}
				.reviews-agg .tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:3px}
				.reviews-agg .tag{font-size:10px;padding:3px 8px;border-radius:999px;background:rgba(52,199,89,.12);border:1px solid rgba(52,199,89,.40);color:#0f6a23;font-weight:700}
				.reviews-agg p{margin:4px 0 0;font-size:12.5px;line-height:1.48;color:#1a3a62;font-weight:500}
				.reviews-agg .cta{margin-top:8px;display:flex;align-items:center;gap:10px;background:linear-gradient(90deg,rgba(52,199,89,.25),rgba(52,199,89,.12));border:1px solid rgba(52,199,89,.40);padding:12px 14px;border-radius:14px;font-weight:900;color:#0e3d1c;text-decoration:none}
				.reviews-agg .cta .text{font-size:15px;letter-spacing:.3px}
				.reviews-agg .cta .pill{margin-left:auto;background:#0f6a23;color:#fff;border-radius:999px;font-size:12px;padding:8px 12px}
			`}</style>

			<div className="header"><h3 className="title">社區評價（聚合）</h3></div>
			<div className="grid">
				<article className="review"><div className="av2">J</div><div><div className="name">J***｜景安和院 住戶 <span className="rating"><span className="star">★★★★★</span></span></div><div className="tags"><span className="tag">#物業/管理</span></div><p>公設維護得乾淨，假日草皮有人整理。之前反映停車動線，管委會一週內就公告改善。</p></div></article>
				<article className="review"><div className="av2">W</div><div><div className="name">W***｜松濤苑 住戶 <span className="rating"><span className="star">★★★★☆</span></span></div><div className="tags"><span className="tag">#噪音</span></div><p>住起來整體舒服，但臨路面向在上下班尖峰車聲明顯，喜靜者建議考慮中高樓層。</p></div></article>
				<article className="review"><div className="av2">L</div><div><div className="name">L***｜遠揚柏悅 住戶 <span className="rating"><span className="star">★★★★☆</span></span></div><div className="tags"><span className="tag">#漏水/壁癌</span></div><p>頂樓排水設計不錯，颱風天沒有積水。不過垃圾車時間稍晚，偶爾有下水道味。</p></div></article>
				<article className="review"><div className="av2">A</div><div><div className="name">A***｜華固名邸 住戶 <span className="rating"><span className="star">★★★★★</span></span></div><div className="tags"><span className="tag">#物業/管理</span></div><p>管理員很負責，包裹收發與公告都有效率；電梯偶爾故障但維修速度快。</p></div></article>
				<article className="review"><div className="av2">H</div><div><div className="name">H***｜寶輝花園廣場 住戶 <span className="rating"><span className="star">★★★☆☆</span></span></div><div className="tags"><span className="tag">#停車/車位</span></div><p>地下室車位轉彎半徑偏小，新手要多注意；平日夜間社區整體很安靜。</p></div></article>
				<article className="review"><div className="av2">K</div><div><div className="name">K***｜潤泰峰匯 住戶 <span className="rating"><span className="star">★★★★☆</span></span></div><div className="tags"><span className="tag">#採光/日照</span></div><p>採光好、通風佳，夏天不會太悶熱；但西曬戶下午還是會稍微熱一些。</p></div></article>
			</div>
			<a className="cta" href="#" aria-label="點我看更多社區評價"><span className="text">👉 點我看更多社區評價</span><span className="pill">前往社區牆</span></a>
		</section>
	)
}
