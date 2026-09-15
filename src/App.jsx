import React, { useEffect, useMemo, useRef, useState } from 'react'
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

const chunk = (arr, size=2) => arr.reduce((acc,_,i)=>(i%size?acc: [...acc, arr.slice(i,i+size)]),[])

// weightTotal is the sum of each answered question's weight (default 1), not
// a plain count — a weight-1.5 "anchor" question counts for 1.5x as much of
// the axis's -3..+3 range on both sides of the average.
function pct(weightedSum,weightTotal){
  if(!weightTotal) return 50
  const max=weightTotal*3
  return Math.max(0,Math.min(100,Math.round(((weightedSum+max)/(max*2))*100)))
}

const AXIS_META = {
  OD: ['유분', '#B9A7F3'],
  SR: ['민감', '#F1DFA7'],
  PN: ['색소', '#E8C1D1'],
  WT: ['노화', '#C4D3EA'],
  CB: ['모공', '#F2C1B5'],
  HQ: ['열반응', '#F2CE9E']
}

const WEATHER_META = {
  sleep:{title:'수면',icon:'😴'},
  dehydration:{title:'피부 당김',icon:'💧'},
  trouble:{title:'트러블',icon:'🔴'},
  heat:{title:'열감',icon:'🔥'},
  stress:{title:'스트레스',icon:'⚡'},
  new_product:{title:'새 제품 사용',icon:'🧴'},
  texture:{title:'피부결',icon:'🌾'}
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
  {key:'environment', test:a=>a.tags.environment>=2, title:'냉난방·건조한 환경에 약해요', desc:'실내외 온습도 변화가 큰 날엔 보습 케어를 더 신경 써주세요.'},
  {key:'friction', test:a=>(a.tags.friction>=2||a.tags.friction_pigmentation>=2), title:'마찰에 쉽게 반응해요', desc:'수건이나 마스크 등으로 인한 마찰을 줄이는 습관이 붉어짐·색소침착 예방에 도움이 돼요.'},
  {key:'combo', test:a=>a.tags.combo_skin>=2, title:'복합성 신호가 보여요', desc:'겉은 번들거려도 속은 건조할 수 있어요. 부위별로 다른 케어가 필요할 수 있어요.'},
  {key:'recovery', test:a=>(a.tags.recovery>=2||a.tags.recovery_speed>=2), title:'자극 회복이 느린 편이에요', desc:'새 제품이나 자극 후 진정까지 시간이 걸리는 편이라, 회복 케어를 충분히 두는 것이 좋아요.'},
  {key:'humid', test:a=>a.tags.humid_weather_response>=2, title:'덥고 습한 날씨에 반응이 커요', desc:'고온다습한 환경에서 유분·트러블이 늘어날 수 있어요.'},
  {key:'mask', test:a=>a.tags.mask_ventilation_discomfort>=2, title:'마스크 등 밀폐 환경에 예민해요', desc:'환기가 안 되는 상황에서 피부 컨디션이 쉽게 나빠질 수 있어요.'},
  {key:'trouble', test:a=>a.weather.trouble?.score>=2, title:'최근 트러블이 늘었어요', desc:'최근 트러블이 늘었다고 답했어요. 자극이 적은 진정 케어를 우선해보세요.'},
  {key:'stress', test:a=>a.weather.stress?.score>=2, title:'스트레스로 컨디션이 흔들리고 있어요', desc:'스트레스는 피부 장벽과 유수분 균형에 영향을 줄 수 있어요.'},
  {key:'sleep', test:a=>a.weather.sleep?.score>=2, title:'수면 부족이 피부에 영향을 주고 있어요', desc:'수면 부족은 탄력 저하와 칙칙함으로 이어지기 쉬워요. 컨디션 회복 케어가 도움이 돼요.'},
  {key:'new_product', test:a=>a.weather.new_product?.score>=2, title:'최근 사용한 새 제품의 영향일 수 있어요', desc:'최근 2주 안에 여러 제품을 바꿨다면, 지금의 반응이 그 영향일 가능성이 있어요.'}
]

const INTENT_OPTIONS = [
  { key: 'very', label: '매우 받고 싶다' },
  { key: 'interested', label: '관심 있다' },
  { key: 'unsure', label: '아직 잘 모르겠다' },
  { key: 'no', label: '필요하지 않다' }
]

const METHOD_OPTIONS = [
  { key: 'skin_type', label: '피부타입 기반' },
  { key: 'current_state', label: '현재 피부상태 기반' },
  { key: 'routine', label: '아침/저녁 루틴' },
  { key: 'season', label: '계절/날씨 기반' },
  { key: 'concern', label: '고민별 집중 추천' },
  { key: 'subscription', label: '세트/구독 추천' }
]

// DEEP 56-question flow: 14 four-question pages, with a short intermission
// card after pages 4/8/12 of 14 (3 total) instead of the old per-chapter
// transition screen. `afterPage` is the 0-indexed page just completed. No
// accuracy/percentage claims in the copy — only progress-feel language.
const DEEP_INTERMISSIONS = [
  { afterPage: 3, title: '피부의 기본 성향이 조금씩 보이기 시작했어요.', sub: '지금까지의 답변을 바탕으로 고객님의 주요 피부 패턴을 확인하고 있어요.' },
  { afterPage: 7, title: '절반 이상 진행했어요.', sub: '피부 성향과 현재 피부 컨디션을 나누어 조금 더 세밀하게 살펴보고 있어요.' },
  { afterPage: 11, title: '마지막 정밀 확인 단계예요.', sub: '몇 가지 질문만 더 확인하면 고객님의 피부 특징을 한눈에 정리할 수 있어요.' }
]
const RESULT_CALC_MESSAGE = { title: '분석이 거의 완성됐어요.', sub: '지금까지의 답변을 바탕으로 피부 타입과 현재 컨디션을 정리하고 있습니다.' }

function HexRadar({ data }) {
  const cx = 110, cy = 140, R = 82
  const LABEL_R = R + 26
  const angleFor = i => (Math.PI * 2 * i) / data.length - Math.PI / 2
  const pointFor = (i, r) => {
    const a = angleFor(i)
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
  }
  const dataPoints = data.map((d, i) => pointFor(i, R * Math.max(0.06, d.value / 100)))
  const dataPath = dataPoints.map(p => p.join(',')).join(' ')
  return (
    <svg viewBox={`0 0 220 ${cy + LABEL_R + 24}`} className="hex-radar" style={{ overflow: 'visible' }} role="img" aria-label="6축 피부 성향 그래프">
      {[0.25, 0.5, 0.75, 1].map((lv, li) => (
        <polygon key={li} points={data.map((_, i) => pointFor(i, R * lv).join(',')).join(' ')} className="hex-radar-grid" />
      ))}
      {data.map((_, i) => {
        const [x, y] = pointFor(i, R)
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="hex-radar-axis" />
      })}
      <polygon points={dataPath} className="hex-radar-shape" />
      {data.map((d, i) => {
        const [x, y] = pointFor(i, R)
        return <circle key={d.label} cx={x} cy={y} r="3.5" className="hex-radar-dot" />
      })}
      {data.map((d, i) => {
        const [x, y] = pointFor(i, R + 26)
        return (
          <text key={d.label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="hex-radar-label">
            {d.label} {d.value}
          </text>
        )
      })}
    </svg>
  )
}

export default function App(){
  const [screen,setScreen]=useState('landing')
  const [mode,setMode]=useState(null) // 'quick' (16, 4-axis) | 'deep' (64, 6-axis)
  const [chapterIndex,setChapterIndex]=useState(0)
  const [batchIndex,setBatchIndex]=useState(0)
  // DEEP-only pagination state (56 questions / 14 pages of 4). QUICK still
  // uses chapterIndex/batchIndex above, untouched.
  const [pageIndex,setPageIndex]=useState(0)
  const [intermission,setIntermission]=useState(null) // null | one of DEEP_INTERMISSIONS | RESULT_CALC_MESSAGE
  const [answers,setAnswers]=useState({})
  const [showInsight,setShowInsight]=useState(false)
  const [contactMethod,setContactMethod]=useState('kakao')
  const [contactValue,setContactValue]=useState('')
  const [consent,setConsent]=useState(false)
  const [leadStatus,setLeadStatus]=useState('')
  const [recommendIntent,setRecommendIntent]=useState('')
  const [recommendMethods,setRecommendMethods]=useState([])
  const [show64Gate,setShow64Gate]=useState(false)
  const [showDetailed64Type,setShowDetailed64Type]=useState(false)
  const [submitting,setSubmitting]=useState(false)
  // A ref (not the `submitting` state) is the actual double-submit guard:
  // it's mutated synchronously, so two clicks fired in the same tick — before
  // React has re-rendered the disabled button — still can't both pass it.
  const submittingRef=useRef(false)

  const toggleMethod=(key)=>setRecommendMethods(v=>v.includes(key)?v.filter(x=>x!==key):[...v,key])

  // Answers/progress state is untouched here — only the scroll position resets
  // whenever the visible "page" (screen/chapter/batch/insight) changes, so a
  // new question always opens at the top instead of wherever the last page
  // happened to be scrolled to.
  useEffect(()=>{
    window.scrollTo(0,0)
  },[screen,chapterIndex,batchIndex,showInsight,pageIndex,intermission])

  // The question bank is filtered once per mode: QUICK 16 only ever sees its
  // 18 four-axis questions; DEEP 64 sees the same 18 plus the 20 more
  // (including all of CB/HQ, which QUICK never asks) that make up its 38
  // type questions, plus the 6-question "최근의 내 피부" state chapter.
  // Chapters with no question in the active mode (e.g. 모공/열반응/최근의
  // 내 피부 chapters under QUICK) simply don't appear — nothing else needs
  // to special-case chapter visibility.
  const activeQuestions = useMemo(
    () => mode ? questions.filter(q=>q.modes.includes(mode)) : [],
    [mode]
  )
  const activeChapters = useMemo(
    () => chapters.filter(c=>activeQuestions.some(q=>q.chapter===c.id)),
    [activeQuestions]
  )

  const chapter=activeChapters[chapterIndex]
  const chapterQs=chapter ? activeQuestions.filter(q=>q.chapter===chapter.id) : []
  // One question per screen: every diagnosis question here is single-choice,
  // so picking an answer auto-advances (see `choose` below) instead of
  // waiting for a manual "다음" click.
  const batches=chunk(chapterQs,1)
  const currentBatch=batches[batchIndex] || []

  // DEEP-only: the same activeQuestions list (56 questions, fixed array
  // order — TYPE axis blocks, then STATE, then the validation question
  // last) sliced into pages of 4 regardless of chapter boundaries.
  const deepPages = useMemo(
    () => mode==='deep' ? chunk(activeQuestions,4) : [],
    [mode, activeQuestions]
  )
  const deepCurrentQs = deepPages[pageIndex] || []
  // A multiSelect question (currently only the validation question) stores
  // an array of chosen option indices in `answers[q.text]` instead of a
  // single index — "answered" means at least one pick, not just "not
  // undefined" (an empty array is still an array).
  const isDeepAnswered = q => q.multiSelect
    ? Array.isArray(answers[q.text]) && answers[q.text].length>0
    : answers[q.text]!==undefined
  const deepAllAnswered = deepCurrentQs.length>0 && deepCurrentQs.every(isDeepAnswered)

  const answeredCount = Object.keys(answers).length
  const totalQuestions = activeQuestions.length
  const overallPercent = totalQuestions ? Math.min(100, Math.round((answeredCount / totalQuestions) * 100)) : 0

  const analysis=useMemo(()=>{
    const sums={OD:0,SR:0,PN:0,WT:0,CB:0,HQ:0}
    const weights={OD:0,SR:0,PN:0,WT:0,CB:0,HQ:0}
    const weather={}
    const tags={}
    activeQuestions.forEach(q=>{
      // validationOnly questions (e.g. the self-perceived-type reference
      // question) never feed TYPE or STATE — checked first so nothing
      // downstream can accidentally pull one into a sum/weight/weather.
      if(q.validationOnly) return
      const picked=answers[q.text]
      if(picked===undefined) return
      const opt=q.options[picked]
      if(q.state) weather[q.axis]={score:opt.score,label:opt.label}
      else if(sums[q.axis]!==undefined){
        const w=q.weight||1
        sums[q.axis]+=opt.score*w; weights[q.axis]+=w
        if(q.tag) tags[q.tag]=opt.score
      }
    })
    const p={}
    Object.keys(sums).forEach(k=>p[k]=pct(sums[k],weights[k]))
    const type16=(p.OD>=50?'O':'D')+(p.SR>=50?'S':'R')+(p.PN>=50?'P':'N')+(p.WT>=50?'W':'T')
    // type64 only exists once CB/HQ were actually asked (DEEP mode) — QUICK
    // never measures those two axes, so it never gets a real 64-code.
    const hasDeepAxes = weights.CB>0 && weights.HQ>0
    const type64 = hasDeepAxes ? type16+(p.CB>=50?'C':'B')+(p.HQ>=50?'H':'Q') : null
    // Per policy: a user who has both a 16 and a 64 result uses the 64
    // result as their representative code.
    const primaryType = type64 || type16
    const result = {p,type16,type64,primaryType,weather,tags}
    result.insights = INSIGHT_RULES.filter(r=>r.test(result))
    return result
  },[answers,activeQuestions])

  // Holds the pending "advance to next question" timer. Re-selecting an
  // answer (or picking a different one) before it fires cancels and
  // reschedules it, so a fast double-tap on an answer — or changing one's
  // mind within the delay window — can never fire two advances for one
  // question; only the last selection before the delay elapses counts.
  const advanceTimerRef=useRef(null)

  const choose=(q,i)=>{
    setAnswers(v=>({...v,[q.text]:i}))
    if(advanceTimerRef.current) clearTimeout(advanceTimerRef.current)
    // Long enough to see the answer highlight before the screen changes,
    // short enough not to feel like a delay.
    advanceTimerRef.current=setTimeout(()=>{
      advanceTimerRef.current=null
      nextBatch()
    },200)
  }

  const nextBatch=()=>{
    if(batchIndex < batches.length-1){
      setBatchIndex(i=>i+1)
    }else{
      setShowInsight(true)
    }
  }

  const nextChapter=()=>{
    setShowInsight(false)
    if(chapterIndex < activeChapters.length-1){
      setChapterIndex(i=>i+1); setBatchIndex(0)
    }else setScreen('result')
  }

  const prev=()=>{
    // A manual "이전" click always wins over a still-pending auto-advance —
    // otherwise the stale timer could fire moments later and shove the user
    // forward again right after they navigated back.
    if(advanceTimerRef.current){clearTimeout(advanceTimerRef.current);advanceTimerRef.current=null}
    if(showInsight){setShowInsight(false); return}
    if(batchIndex>0){setBatchIndex(i=>i-1); return}
    if(chapterIndex>0){
      const pi=chapterIndex-1
      const prevQs=activeQuestions.filter(q=>q.chapter===activeChapters[pi].id)
      setChapterIndex(pi); setBatchIndex(Math.max(0,chunk(prevQs,1).length-1))
    }
  }

  // DEEP paginated flow: picking an answer only records it — no auto-advance,
  // the user must hit "다음" once all 4 questions on the page are answered.
  const chooseDeep=(q,i)=>{
    if(!q.multiSelect){ setAnswers(v=>({...v,[q.text]:i})); return }
    setAnswers(v=>{
      const current = Array.isArray(v[q.text]) ? v[q.text] : []
      const opt = q.options[i]
      let next
      if(opt.exclusive){
        // Tapping an exclusive option ("특별히 없음"/"잘 모르겠어요") always
        // replaces the whole selection with just itself — tapping it again
        // clears the question back to unanswered.
        next = (current.length===1 && current[0]===i) ? [] : [i]
      }else{
        // Picking any regular option first drops whichever exclusive
        // option was selected (the two states can never coexist), then
        // toggles the tapped option in/out of the selection as usual.
        const withoutExclusive = current.filter(idx=>!q.options[idx].exclusive)
        next = withoutExclusive.includes(i)
          ? withoutExclusive.filter(idx=>idx!==i)
          : [...withoutExclusive, i]
      }
      return {...v, [q.text]: next}
    })
  }

  const nextDeepPage=()=>{
    if(!deepAllAnswered) return
    if(pageIndex===deepPages.length-1){
      setIntermission(RESULT_CALC_MESSAGE)
      return
    }
    const msg=DEEP_INTERMISSIONS.find(m=>m.afterPage===pageIndex)
    if(msg) setIntermission(msg)
    else setPageIndex(i=>i+1)
  }

  const prevDeepPage=()=>{
    if(pageIndex>0) setPageIndex(i=>i-1)
  }

  // Tapping the intermission card skips straight to the next step; the
  // effect below fires the same transition automatically after a short
  // delay so nobody gets stuck needing to tap through it.
  const skipIntermission=()=>{
    if(intermission===RESULT_CALC_MESSAGE) setScreen('result')
    else setPageIndex(i=>i+1)
    setIntermission(null)
  }

  useEffect(()=>{
    if(!intermission) return
    const t=setTimeout(()=>{
      if(intermission===RESULT_CALC_MESSAGE) setScreen('result')
      else setPageIndex(i=>i+1)
      setIntermission(null)
    },1700)
    return ()=>clearTimeout(t)
  },[intermission])

  const submitLead = async () => {
    // Guards against a double click (or any duplicate call in the same
    // click event) inserting the same registration twice — once a save is
    // in flight, or has already succeeded, this is a no-op.
    if(submittingRef.current || showDetailed64Type) return
    const value = contactValue.trim()
    if(!value || !consent){
      setLeadStatus('연락처와 동의 항목을 확인해주세요.')
      return
    }
    submittingRef.current=true
    setSubmitting(true)
    setLeadStatus('')
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
        recommend_intent: recommendIntent || null,
        recommend_methods: recommendMethods,
        answers,
        skin_version: 'v3.3',
        source: 'beta-web'
      })
      if(res?.success){
        // Only a confirmed save unlocks the detailed 64-type reveal.
        setShowDetailed64Type(true)
      }else{
        setLeadStatus('정보 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
    }catch(e){
      console.error(e)
      setLeadStatus('정보 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }finally{
      submittingRef.current=false
      setSubmitting(false)
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
      <div className="meta"><span>회원가입 없음</span><span>무료</span></div>

      <div className="mode-picker">
        <button className="mode-card mode-card--quick" onClick={()=>{setMode('quick');setScreen('journey')}}>
          <span className="mode-card-title">QUICK 16</span>
          <span className="mode-card-desc">18문항 · 1~2분 · 4축 기본 진단</span>
        </button>
        <button className="mode-card mode-card--deep" onClick={()=>{setMode('deep');setScreen('journey')}}>
          <span className="mode-card-title">DEEP 64</span>
          <span className="mode-card-desc">38문항 내외 · 4~5분 · 6축 정밀 진단</span>
        </button>
      </div>
      <small>회원가입 없이 바로 시작할 수 있어요.</small>
    </section>
  </main>

  if(screen==='journey') return <main className="screen">
    <section className="phone-card journey-card">
      <div className="journey-head">
        <div>
          <div className="brand">SOULLY</div>
          <h2>{mode==='deep'?'피부 정밀 탐색 여정':'피부 빠른 탐색 여정'}</h2>
          <p>{activeChapters.length}개의 장면을 따라가며 피부를 살펴봐요 · 약 {mode==='deep'?'4~5':'1~2'}분</p>
        </div>
      </div>
      <div className="journey-list">
        {activeChapters.map((c,i)=><div key={c.id} className="journey-row static">
          <div className="hexnum" style={{background:c.soft,color:c.deep,borderColor:c.accent}}>{i+1}</div>
          <div><strong>{c.title}</strong><span>{c.label}</span></div>
          <i>{i===0?'START':'•'}</i>
        </div>)}
      </div>
      <button className="cta purple" onClick={()=>{setChapterIndex(0);setBatchIndex(0);setShowInsight(false);setPageIndex(0);setIntermission(null);setScreen('test')}}>처음부터 시작하기</button>
    </section>
  </main>

  if(screen==='result'){
    const activeAxisKeys = mode==='deep' ? ['OD','SR','PN','WT','CB','HQ'] : ['OD','SR','PN','WT']
    const vals = activeAxisKeys.map(k=>[AXIS_META[k][0], analysis.p[k], AXIS_META[k][1]])
    return <main className="screen result-screen">
      <section className="phone-card result-card">
        <div className="brand">SOULLY SKIN TYPE</div>
        <div className="mode-badge">{mode==='deep'?'DEEP 64':'QUICK 16'}</div>
        <p className="muted">당신의 Skin Type</p>
        <h1 className="type">{analysis.primaryType}</h1>
        {analysis.type64 && <p className="type-sub">Skin16 기준 · {analysis.type16}</p>}
        <h3>나만의 피부 성향 프로필</h3>

        <HexRadar data={vals.map(([label,value])=>({label,value}))} />

        <div className="polygon-grid">
          {vals.map(([l,v,c])=><div className="result-poly" key={l} style={{'--pc':c}}>
            <strong>{v}</strong><span>{l}</span>
          </div>)}
        </div>

        <div className="score-box">
          {activeAxisKeys.map(k=><div className="score-line" key={k}>
            <div><b>{AXIS[k][0]} {analysis.p[k]}</b><span>{AXIS[k][1]} {100-analysis.p[k]}</span></div>
            <div className="track"><i style={{width:`${analysis.p[k]}%`}}/></div>
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

        <div className="recommend-card">
          <div className="lead-kicker">맞춤 추천 의향</div>
          <h3>추후 내 피부에 맞는 제품 추천을 받고 싶나요?</h3>
          <div className="intent-options">
            {INTENT_OPTIONS.map(o=>
              <button
                key={o.key}
                className={`intent-btn ${recommendIntent===o.key?'selected':''}`}
                onClick={()=>setRecommendIntent(o.key)}
              >{o.label}</button>
            )}
          </div>
          {recommendIntent && recommendIntent!=='no' && <>
            <p className="recommend-sub">원하는 추천 방식을 골라주세요 (복수 선택 가능)</p>
            <div className="method-options">
              {METHOD_OPTIONS.map(o=>
                <button
                  key={o.key}
                  className={`method-chip ${recommendMethods.includes(o.key)?'selected':''}`}
                  onClick={()=>toggleMethod(o.key)}
                >{o.label}</button>
              )}
            </div>
          </>}
        </div>

        {mode==='quick' && <div className="lead-card unlock-teaser">
          <div className="lead-kicker">SOULLY SKIN 64</div>
          <h3>64가지 세부 피부 MBTI가 궁금하다면?</h3>
          <p>지금 결과는 4축 기반 QUICK 16이에요. 모공(CB)·열반응(HQ)까지 더한 DEEP 64 정밀진단을 받아보면 64타입 세부 결과를 확인할 수 있어요.</p>
          <div className="deep-upgrade-actions">
            <button className="cta purple" onClick={()=>{
              // Keep existing answers — questions shared between QUICK and
              // DEEP carry the same q.text key, so they land pre-filled.
              // Jump straight into the test screen at the first page that
              // still has an unanswered question, skipping the journey
              // intro (redundant for someone who already started).
              const deepQs = questions.filter(q=>q.modes.includes('deep'))
              const pages = chunk(deepQs,4)
              const isAnsweredIn = q => q.multiSelect
                ? Array.isArray(answers[q.text]) && answers[q.text].length>0
                : answers[q.text]!==undefined
              let target = pages.findIndex(page=>page.some(q=>!isAnsweredIn(q)))
              if(target===-1) target=0
              setChapterIndex(0);setBatchIndex(0);setPageIndex(target);setIntermission(null);setMode('deep');setScreen('test')
            }}>이어서 DEEP 64 진행하기</button>
            <button className="cta-secondary" onClick={()=>{
              setAnswers({});setChapterIndex(0);setBatchIndex(0);setPageIndex(0);setIntermission(null);setMode('deep');setScreen('journey')
            }}>처음부터 새로 하기</button>
          </div>
        </div>}

        {mode==='deep' && !showDetailed64Type && !show64Gate && <div className="lead-card unlock-teaser">
          <div className="lead-kicker">SOULLY SKIN 64</div>
          <h3>내 피부 MBTI를 더 자세히 알고 싶나요?</h3>
          <p>카카오톡 또는 이메일을 남기면 64가지 세부 피부 MBTI 결과를 확인할 수 있어요.</p>
          <button className="cta purple" onClick={()=>setShow64Gate(true)}>64타입 상세 결과 보기</button>
        </div>}

        {mode==='deep' && !showDetailed64Type && show64Gate && <div className="lead-card">
          <div className="lead-kicker">SOULLY SKIN 64</div>
          <h3>64타입 피부 MBTI 결과를 받아보세요</h3>
          <p>카카오톡 또는 이메일을 남기고 개인정보 수집에 동의하면 상세 결과를 바로 확인할 수 있어요.</p>

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
            <span>개인정보 수집 및 이용에 동의합니다. (연락처, 피부진단 결과 — 64타입 결과 제공 및 안내 목적)</span>
          </label>

          <button className="cta lead-submit" onClick={submitLead} disabled={submitting}>
            {submitting?'등록 중...':'내 64타입 결과 확인하기'}
          </button>
          {leadStatus && <div className="lead-status">{leadStatus}</div>}
        </div>}

        {mode==='deep' && showDetailed64Type && <div className="skin64-card">
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
        </div>}

        <button className="cta purple" onClick={()=>{
          setAnswers({});setChapterIndex(0);setBatchIndex(0);setPageIndex(0);setIntermission(null);setScreen('landing');setMode(null)
          setContactValue('');setConsent(false);setLeadStatus('')
          setShow64Gate(false);setShowDetailed64Type(false);setSubmitting(false);submittingRef.current=false
        }}>처음부터 다시 하기</button>
      </section>
    </main>
  }

  // DEEP mode's own 56-question / 14-page flow. QUICK mode never reaches
  // here (mode==='quick' falls through to the original chapter-based
  // screen below, completely untouched).
  if(mode==='deep' && screen==='test'){
    if(intermission){
      return <main className="screen themed" style={theme} onClick={skipIntermission}>
        <section className="phone-card insight-screen intermission-screen">
          <div className="brand">SOULLY</div>
          <div className="big-hex intermission-spark">✦</div>
          <h2>{intermission.title}</h2>
          <p>{intermission.sub}</p>
        </section>
      </main>
    }

    const totalPages = deepPages.length
    const pagePercent = totalPages ? Math.round(((pageIndex+1)/totalPages)*100) : 0

    return <main className="screen themed" style={theme}>
      <section className="phone-card test-card">
        <header className="test-head">
          <div><div className="brand">SOULLY</div><h2>피부 정밀 진단</h2></div>
          <span>{pageIndex+1} / {totalPages}</span>
        </header>

        <div className="overall-progress">
          <div className="overall-progress-top">
            <span>진행 페이지</span>
            <strong>{pageIndex+1} / {totalPages} · {pagePercent}%</strong>
          </div>
          <div className="overall-track"><i style={{width:`${pagePercent}%`}} /></div>
          <div className="overall-progress-sub">{answeredCount} / {totalQuestions} 문항 완료</div>
        </div>

        <div className="question-panel deep-question-list">
          {deepCurrentQs.map((q,qi)=><React.Fragment key={q.text}>
            {qi>0 && <div className="deep-divider" />}
            <article className="question deep-question">
              <h3>{q.text}</h3>
              <div className="answers">
                {q.options.map((o,i)=>{
                  const isSelected = q.multiSelect
                    ? Array.isArray(answers[q.text]) && answers[q.text].includes(i)
                    : answers[q.text]===i
                  return <button key={o.label} className={`answer ${isSelected?'selected':''}`} onClick={()=>chooseDeep(q,i)}>
                    <span className="mini-check">{isSelected?'✓':''}</span><span>{o.label}</span>
                  </button>
                })}
              </div>
            </article>
          </React.Fragment>)}
        </div>

        <footer className="nav">
          <button className="back" onClick={prevDeepPage} disabled={pageIndex===0}>← 이전</button>
          <button className="next themed-btn" onClick={nextDeepPage} disabled={!deepAllAnswered}>
            {pageIndex===totalPages-1?'결과 계산하기':'다음'}
          </button>
        </footer>
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
      <button className="cta themed-btn" onClick={nextChapter}>{chapterIndex===activeChapters.length-1?'결과 보기':'다음 챕터'}</button>
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
        {activeChapters.map((c,i)=><div className="hex-step" key={c.id}>
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
        <button className="back back-solo" onClick={prev} disabled={chapterIndex===0&&batchIndex===0}>← 이전</button>
      </footer>
    </section>
  </main>
}
