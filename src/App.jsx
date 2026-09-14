import React, { useMemo, useState } from 'react'
import { chapters, questions } from './questions'
import { saveLead } from './supabase'

const AXIS = {
  OD:['유분','건조'],
  SR:['민감','저민감'],
  PN:['색소흔적','비색소'],
  WT:['노화징후','탄력안정'],
  CB:['모공막힘','밸런스'],
  HQ:['열반응','안정']
}

const WEATHER_META = {
  sleep:{title:'수면',icon:'😴'},
  dehydration:{title:'피부 당김',icon:'💧'},
  trouble:{title:'트러블',icon:'🔴'},
  heat:{title:'열감',icon:'🔥'},
  stress:{title:'스트레스',icon:'⚡'},
  new_product:{title:'새 제품 사용',icon:'🧴'}
}

const TYPE64_INFO = {
  OD:{O:['유분',"코와 이마를 중심으로 유분이 쉽게 느껴지는 타입이에요."],D:['건조',"세안 후 당김이 느껴지고 유수분이 부족해지기 쉬운 타입이에요."]},
  SR:{S:['민감',"새로운 성분이나 자극에 피부가 예민하게 반응하는 편이에요."],R:['저민감',"웬만한 자극에는 비교적 안정적으로 버티는 편이에요."]},
  PN:{P:['색소흔적',"트러블이나 자극이 지나간 자리에 흔적이 잘 남는 편이에요."],N:['비색소',"트러블이 가라앉으면 흔적 없이 비교적 빨리 회복되는 편이에요."]},
  WT:{W:['노화징후',"잔주름이나 탄력 저하 신호가 비교적 먼저 나타나는 편이에요."],T:['탄력안정',"탄력이 비교적 안정적으로 유지되는 편이에요."]},
  CB:{C:['모공막힘',"모공이 막히거나 트러블로 이어지기 쉬운 편이에요."],B:['밸런스',"모공 트러블보다는 유수분 밸런스가 관건인 편이에요."]},
  HQ:{H:['열반응',"열과 자극에 쉽게 붉어지거나 화끈거리는 편이에요."],Q:['안정',"온도 변화에도 비교적 안정적인 편이에요."]}
}

const INSIGHT_RULES = [
  {key:'fragrance', test:a=>a.tags.fragrance>=2, title:'향 민감 반응이 보여요', desc:'향이 강한 제품이나 향료·에센셜오일이 포함된 제품은 제품 선택 시 우선 확인하는 것이 좋아요.'},
  {key:'alcohol', test:a=>a.tags.alcohol>=2, title:'알코올 성분에 민감해요', desc:'알코올감이 강한 토너나 선제품은 따갑거나 건조해질 수 있어 저자극 제형을 우선 확인해보세요.'},
  {key:'barrier', test:a=>a.tags.barrier>=2, title:'피부 장벽이 예민한 편이에요', desc:'컨디션이 안 좋은 날은 평소 쓰던 제품도 자극이 될 수 있어요. 장벽 강화 케어를 함께 챙겨보세요.'},
  {key:'exfoliation', test:a=>a.tags.exfoliation>=2, title:'각질 케어 후 회복이 느려요', desc:'필링이나 각질 제거 제품은 사용 빈도를 낮추고 회복 시간을 충분히 두는 것이 좋아요.'},
  {key:'environment', test:a=>a.tags.environment>=2, title:'냉난방·건조한 환경에 약해요', desc:'실내외 온습도 변화가 큰 날엔 보습 케어를 더 신경 써주세요.'},
  {key:'friction', test:a=>a.tags.friction>=2, title:'마찰에 쉽게 반응해요', desc:'수건이나 마스크 등으로 인한 마찰을 줄이는 습관이 붉어짐 예방에 도움이 돼요.'},
  {key:'combo', test:a=>(a.tags.combo_skin>=2||a.tags.dehydrated_oily>=2), title:'수분부족지성·복합성 신호가 보여요', desc:'겉은 번들거려도 속은 건조할 수 있어요. 부위별로 다른 케어가 필요할 수 있어요.'},
  {key:'trouble', test:a=>a.weather.trouble?.score>=2, title:'최근 트러블이 늘었어요', desc:'최근 1주일 사이 트러블이 늘었다고 답했어요. 자극이 적은 진정 케어를 우선해보세요.'},
  {key:'stress', test:a=>a.weather.stress?.score>=2, title:'스트레스로 컨디션이 흔들리고 있어요', desc:'스트레스는 피부 장벽과 유수분 균형에 영향을 줄 수 있어요.'},
  {key:'sleep', test:a=>a.weather.sleep?.score>=2, title:'수면 부족이 피부에 영향을 주고 있어요', desc:'수면 부족은 탄력 저하와 칙칙함으로 이어지기 쉬워요. 컨디션 회복 케어가 도움이 돼요.'},
  {key:'new_product', test:a=>a.weather.new_product?.score>=2, title:'최근 사용한 새 제품의 영향일 수 있어요', desc:'최근 2주 안에 여러 제품을 바꿨다면, 지금의 반응이 그 영향일 가능성이 있어요.'}
]

const chunk = (arr, size=2) => arr.reduce((acc,_,i)=>(i%size?acc: [...acc, arr.slice(i,i+size)]),[])

function pct(sum,count){
  if(!count) return 50
  const max=count*3
  return Math.max(0,Math.min(100,Math.round(((sum+max)/(max*2))*100)))
}

export default function App(){
  const [screen,setScreen]=useState('landing')
  const [chapterIndex,setChapterIndex]=useState(0)
  const [batchIndex,setBatchIndex]=useState(0)
  const [answers,setAnswers]=useState({})
  const [showInsight,setShowInsight]=useState(false)
  const [contactMethod,setContactMethod]=useState('kakao')
  const [contactValue,setContactValue]=useState('')
  const [consent,setConsent]=useState(false)
  const [leadStatus,setLeadStatus]=useState('')

  const chapter=chapters[chapterIndex]
  const chapterQs=questions.filter(q=>q.chapter===chapter.id)
  const batches=chunk(chapterQs,2)
  const currentBatch=batches[batchIndex] || []
  const batchDone=currentBatch.every(q=>answers[q.text]!==undefined)

  const answeredCount = Object.keys(answers).length
  const totalQuestions = questions.length
  const overallPercent = Math.min(100, Math.round((answeredCount / totalQuestions) * 100))

  const analysis=useMemo(()=>{
    const sums={OD:0,SR:0,PN:0,WT:0,CB:0,HQ:0}
    const counts={OD:0,SR:0,PN:0,WT:0,CB:0,HQ:0}
    const weather={}
    const tags={}
    questions.forEach(q=>{
      const picked=answers[q.text]
      if(picked===undefined) return
      const opt=q.options[picked]
      if(q.state) weather[q.axis]={score:opt.score,label:opt.label}
      else if(sums[q.axis]!==undefined){
        sums[q.axis]+=opt.score; counts[q.axis]++
        if(q.tag) tags[q.tag]=opt.score
      }
    })
    const p={}
    Object.keys(sums).forEach(k=>p[k]=pct(sums[k],counts[k]))
    const type16=(p.OD>=50?'O':'D')+(p.SR>=50?'S':'R')+(p.PN>=50?'P':'N')+(p.WT>=50?'W':'T')
    const type64=type16+(p.CB>=50?'C':'B')+(p.HQ>=50?'H':'Q')
    const result={p,type16,type64,weather,tags}
    result.insights=INSIGHT_RULES.filter(r=>r.test(result))
    return result
  },[answers])

  const choose=(q,i)=>setAnswers(v=>({...v,[q.text]:i}))

  const nextBatch=()=>{
    if(batchIndex < batches.length-1){
      setBatchIndex(i=>i+1); window.scrollTo({top:0,behavior:'smooth'})
    }else{
      setShowInsight(true); window.scrollTo({top:0,behavior:'smooth'})
    }
  }

  const nextChapter=()=>{
    setShowInsight(false)
    if(chapterIndex < chapters.length-1){
      setChapterIndex(i=>i+1); setBatchIndex(0)
    }else setScreen('result')
    window.scrollTo({top:0,behavior:'smooth'})
  }

  const prev=()=>{
    if(showInsight){setShowInsight(false); return}
    if(batchIndex>0){setBatchIndex(i=>i-1); return}
    if(chapterIndex>0){
      const pi=chapterIndex-1
      const prevQs=questions.filter(q=>q.chapter===chapters[pi].id)
      setChapterIndex(pi); setBatchIndex(Math.max(0,chunk(prevQs,2).length-1))
    }
  }

  const submitLead = async () => {
    const value = contactValue.trim()
    if(!value || !consent){
      setLeadStatus('연락처와 동의 항목을 확인해주세요.')
      return
    }
    try{
      const res = await saveLead({
        contact_method: contactMethod,
        contact_value: value,
        consent,
        skin16: analysis.type16,
        skin64_candidate: analysis.type64,
        oil_score: analysis.p.OD,
        sensitivity_score: analysis.p.SR,
        pigmentation_score: analysis.p.PN,
        aging_score: analysis.p.WT,
        congestion_score: analysis.p.CB,
        heat_score: analysis.p.HQ,
        source: 'beta-web'
      })
      setLeadStatus(res.mode === 'supabase'
        ? '등록됐어요. 정식 버전 소식을 보내드릴게요.'
        : '이 PC에 임시 저장됐어요. Supabase를 연결하면 회사 전체 응답을 한곳에 모을 수 있어요.')
    }catch(e){
      console.error(e)
      setLeadStatus('저장 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  const theme={'--accent':chapter?.accent,'--soft':chapter?.soft,'--deep':chapter?.deep}

  if(screen==='landing') return <main className="screen landing">
    <div className="orb orb1"/><div className="orb orb2"/>
    <section className="phone-card intro-card">
      <div className="brand">SOULLY</div>
      <div className="spark">✦</div>
      <h1>나를 가장 잘 아는<br/>피부 탐색</h1>
      <div className="kicker">SKIN TYPE BETA</div>
      <p>피부의 일상 반응을 따라가며<br/>나만의 피부 성향을 섬세하게 분석해요.</p>
      <div className="meta"><span>약 5–7분</span><span>8개 챕터</span><span>무료</span></div>
      <button className="cta purple" onClick={()=>setScreen('journey')}>테스트 시작하기</button>
      <small>회원가입 없이 바로 시작할 수 있어요.</small>
    </section>
  </main>

  if(screen==='journey') return <main className="screen">
    <section className="phone-card journey-card">
      <div className="journey-head">
        <div><div className="brand">SOULLY</div><h2>피부 탐색 여정</h2><p>8개의 장면을 따라가며 피부를 살펴봐요.</p></div>
      </div>
      <div className="journey-list">
        {chapters.map((c,i)=><div key={c.id} className="journey-row static">
          <div className="hexnum" style={{background:c.soft,color:c.deep,borderColor:c.accent}}>{i+1}</div>
          <div><strong>{c.title}</strong><span>{c.label}</span></div>
          <i>{i===0?'START':'•'}</i>
        </div>)}
      </div>
      <button className="cta purple" onClick={()=>{setChapterIndex(0);setBatchIndex(0);setShowInsight(false);setScreen('test')}}>처음부터 시작하기</button>
    </section>
  </main>

  if(screen==='result'){
    const vals=[
      ['유분',analysis.p.OD,'#B9A7F3'],['민감',analysis.p.SR,'#F1DFA7'],
      ['색소',analysis.p.PN,'#E8C1D1'],['노화',analysis.p.WT,'#C4D3EA'],
      ['모공',analysis.p.CB,'#F2C1B5'],['열반응',analysis.p.HQ,'#F2CE9E']
    ]
    return <main className="screen result-screen">
      <section className="phone-card result-card">
        <div className="brand">SOULLY SKIN TYPE</div>
        <p className="muted">당신의 Skin Type</p>
        <h1 className="type">{analysis.type16}</h1>
        <h3>나만의 피부 성향 프로필</h3>

        <div className="polygon-grid">
          {vals.map(([l,v,c])=><div className="result-poly" key={l} style={{'--pc':c}}>
            <strong>{v}</strong><span>{l}</span>
          </div>)}
        </div>

        <div className="score-box">
          {[
            ['OD',analysis.p.OD],['SR',analysis.p.SR],['PN',analysis.p.PN],
            ['WT',analysis.p.WT],['CB',analysis.p.CB],['HQ',analysis.p.HQ]
          ].map(([k,v])=><div className="score-line" key={k}>
            <div><b>{AXIS[k][0]} {v}</b><span>{AXIS[k][1]} {100-v}</span></div>
            <div className="track"><i style={{width:`${v}%`}}/></div>
          </div>)}
        </div>

        {Object.keys(analysis.weather).length > 0 && <div className="weather-panel">
          <div className="weather-panel-title">Skin Weather · 최근 컨디션</div>
          <div className="weather-grid">
            {Object.entries(analysis.weather).map(([axis,w])=>{
              const meta=WEATHER_META[axis]
              if(!meta) return null
              return <div className="weather-row" key={axis}>
                <span className="weather-icon">{meta.icon}</span>
                <span className="weather-title">{meta.title}</span>
                <span className="weather-value">{w.label}</span>
              </div>
            })}
          </div>
        </div>}

        {analysis.insights.slice(0,4).map(ins=><div className="insight-card" key={ins.key}>
          <b>{ins.title}</b>
          <p>{ins.desc}</p>
        </div>)}

        <div className="lead-card">
          <div className="lead-kicker">SOULLY 64 사전 등록</div>
          <h3>내 결과를 다시 받아보고 싶나요?</h3>
          <p>정식 Skin 64 오픈 소식과 내 피부 결과 업데이트를 받아볼 연락처를 남겨주세요.</p>

          <div className="method-tabs">
            <button
              className={contactMethod==='kakao'?'active':''}
              onClick={()=>{setContactMethod('kakao');setLeadStatus('')}}
            >카카오톡</button>
            <button
              className={contactMethod==='email'?'active':''}
              onClick={()=>{setContactMethod('email');setLeadStatus('')}}
            >이메일</button>
          </div>

          <input
            className="contact-input"
            type={contactMethod==='email'?'email':'text'}
            value={contactValue}
            onChange={e=>setContactValue(e.target.value)}
            placeholder={contactMethod==='email'?'example@company.com':'카카오톡 ID 또는 연락 가능한 번호'}
          />

          <label className="consent-row">
            <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />
            <span>SOULLY Skin 64 오픈 및 피부 결과 안내를 위한 연락처 저장에 동의합니다.</span>
          </label>

          <button className="cta lead-submit" onClick={submitLead}>등록하기</button>
          {leadStatus && <div className="lead-status">{leadStatus}</div>}
        </div>

        <div className="skin64-card">
          <div className="skin64-kicker">SOULLY SKIN 64</div>
          <div className="skin64-code">{analysis.type64}</div>
          <div className="skin64-grid">
            {Object.keys(AXIS).map((axis,i)=>{
              const letter=analysis.type64[i]
              const [name,desc]=TYPE64_INFO[axis][letter]
              return <div className="skin64-item" key={axis}>
                <div className="skin64-letter">{letter}</div>
                <div className="skin64-item-body">
                  <b>{name}</b>
                  <p>{desc}</p>
                </div>
              </div>
            })}
          </div>
        </div>
        <button className="cta purple" onClick={()=>{setAnswers({});setChapterIndex(0);setBatchIndex(0);setScreen('landing');setContactValue('');setConsent(false);setLeadStatus('')}}>처음부터 다시 하기</button>
      </section>
    </main>
  }

  if(showInsight) return <main className="screen themed" style={theme}>
    <section className="phone-card insight-screen">
      <div className="brand">SOULLY</div>
      <div className="insight-progress">
        <span>전체 진행률</span><strong>{overallPercent}%</strong>
      </div>
      <div className="big-hex" style={{background:chapter.soft,color:chapter.deep}}>{chapter.emoji}</div>
      <h2>{chapter.title}</h2>
      <p>{chapter.intro}</p>
      <div className="mini-note">이 챕터의 피부 신호를 확인했어요.</div>
      <button className="cta themed-btn" onClick={nextChapter}>{chapterIndex===chapters.length-1?'결과 보기':'다음 챕터'}</button>
      <button className="text-btn" onClick={prev}>이전으로</button>
    </section>
  </main>

  return <main className="screen themed" style={theme}>
    <section className="phone-card test-card">
      <header className="test-head">
        <div><div className="brand">SOULLY</div><h2>{chapter.emoji} {chapter.title}</h2></div>
        <span>{overallPercent}%</span>
      </header>

      <div className="overall-progress">
        <div className="overall-progress-top">
          <span>전체 피부 탐색 진행률</span>
          <strong>{overallPercent}%</strong>
        </div>
        <div className="overall-track"><i style={{width:`${overallPercent}%`}} /></div>
      </div>

      <div className="hex-progress">
        {chapters.map((c,i)=><div className="hex-step" key={c.id}>
          <div className={`hex ${i===chapterIndex?'current':i<chapterIndex?'done':''}`} style={{'--hc':c.accent,'--hs':c.soft,'--hd':c.deep}}>{i+1}</div>
          <small>{c.title}</small>
        </div>)}
      </div>

      <div className="category">{chapter.label}</div>

      <div className="question-panel">
        {currentBatch.map(q=><article className="question" key={q.text}>
          <h3>{q.text}</h3>
          <div className="answers">
            {q.options.map((o,i)=><button key={o.label} className={`answer ${answers[q.text]===i?'selected':''}`} onClick={()=>choose(q,i)}>
              <span className="mini-check">{answers[q.text]===i?'✓':''}</span><span>{o.label}</span>
            </button>)}
          </div>
        </article>)}
      </div>

      <footer className="nav">
        <button className="back" onClick={prev} disabled={chapterIndex===0&&batchIndex===0}>← 이전</button>
        <button className="next themed-btn" disabled={!batchDone} onClick={nextBatch}>{batchIndex===batches.length-1?'챕터 마치기':'다음 →'}</button>
      </footer>
    </section>
  </main>
}
