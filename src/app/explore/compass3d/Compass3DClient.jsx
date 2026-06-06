'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';

const SUPABASE_URL = 'https://shgdrkrqjnwtlyxcdayp.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNoZ2Rya3Jxam53dGx5eGNkYXlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMzgwNjYsImV4cCI6MjA5NTkxNDA2Nn0.L5NPabtJGLFWb81SruP3XfjgFuycu4DhvaMJhInqWfo';

const TC = {
  'Super Culty':   {fill:'#e8574d', stroke:'#cc1133', hi:'#ff99aa'},
  'Kinda Culty':   {fill:'#d99b3e', stroke:'#b38200', hi:'#ffdd66'},
  'Not Culty':     {fill:'#5cb878', stroke:'#116688', hi:'#66ddff'},
};
const TIERS = ['Super Culty','Kinda Culty','Not Culty'];

export default function Compass3DClient() {
  const canvasRef = useRef(null);
  const wrapRef   = useRef(null);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState(null);
  const [ttPos, setTtPos]   = useState({x:0,y:0});
  const [showLabels, setShowLabels]   = useState(false);
  const [showGrid,   setShowGrid]     = useState(true);
  const [showSurface,setShowSurface]  = useState(false);
  const [showStems,  setShowStems]    = useState(true);
  const [autoSpeed,  setAutoSpeed]    = useState(0.5);

  const camRef  = useRef({ h: 0.22, v: -0.16, zoom: 1 });
  const dragRef = useRef({ dragging: false, lx: 0, ly: 0 });
  const ptsRef  = useRef([]);
  const rafRef  = useRef(null);

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/political_scores?select=economic_axis,authority_axis,political_quadrant,organizations(name,slug,category,composite_tier,composite_score,trajectory)`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } })
      .then(r => r.json())
      .then(data => {
        const mapped = (Array.isArray(data) ? data : [])
          .filter(d => d.organizations && d.economic_axis != null && d.authority_axis != null)
          .map(d => ({
            name:  d.organizations.name,
            slug:  d.organizations.slug,
            cat:   d.organizations.category,
            tier:  d.organizations.composite_tier || 'Not Culty',
            score: parseFloat(d.organizations.composite_score || 0),
            econ:  parseFloat(d.economic_axis),
            auth:  parseFloat(d.authority_axis),
            quad:  d.political_quadrant,
          }));
        setOrgs(mapped);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const onDown = e => { dragRef.current.dragging = true; dragRef.current.lx = e.clientX; dragRef.current.ly = e.clientY; };
    const onUp   = () => { dragRef.current.dragging = false; };
    const onMove = e => {
      if (!dragRef.current.dragging) return;
      camRef.current.h += (e.clientX - dragRef.current.lx) * 0.007;
      camRef.current.v += (e.clientY - dragRef.current.ly) * 0.004;
      camRef.current.v = Math.max(-0.65, Math.min(0.65, camRef.current.v));
      dragRef.current.lx = e.clientX; dragRef.current.ly = e.clientY;
    };
    const onWheel = e => {
      e.preventDefault();
      camRef.current.zoom *= e.deltaY > 0 ? 0.93 : 1.07;
      camRef.current.zoom = Math.max(0.4, Math.min(3.5, camRef.current.zoom));
    };
    const onMMove = e => {
      const rect = wrap.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      let best = null, bestD = 18;
      ptsRef.current.forEach(p => {
        const d = Math.hypot(p.px - mx, p.py - my);
        if (d < bestD) { bestD = d; best = p; }
      });
      setHovered(best ? best.org : null);
      if (best) setTtPos({ x: mx, y: my });
    };
    wrap.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('mousemove', onMove);
    wrap.addEventListener('mousemove', onMMove);
    wrap.addEventListener('mouseleave', () => setHovered(null));
    wrap.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      wrap.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('mousemove', onMove);
      wrap.removeEventListener('mousemove', onMMove);
      wrap.removeEventListener('wheel', onWheel);
    };
  }, []);

  useEffect(() => {
    if (!orgs.length) return;
    const canvas = canvasRef.current;
    const wrap   = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext('2d');
    const dpr = devicePixelRatio || 1;

    function resize() {
      const W = wrap.clientWidth, H = wrap.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    function project(econ, auth, score) {
      const { h, v, zoom } = camRef.current;
      const W = wrap.clientWidth, H = wrap.clientHeight;
      const sx = econ/5, sy = auth/5, sz = (score/100)*2-1;
      const ch = Math.cos(h), sh = Math.sin(h);
      const cv = Math.cos(v), sv = Math.sin(v);
      const rx = sx*ch - sz*sh, rz = sx*sh + sz*ch;
      const ry = sy*cv - rz*sv, rz2 = sy*sv + rz*cv;
      const fov = 4, s = fov/(fov+rz2)*zoom;
      return { px: W/2 + rx*s*W*0.38, py: H/2 - ry*s*H*0.38, depth: rz2, scale: s };
    }

    function drawDot(px, py, r, c) {
      const grad = ctx.createRadialGradient(px-r*0.3, py-r*0.3, r*0.05, px, py, r);
      grad.addColorStop(0, c.hi);
      grad.addColorStop(0.5, c.fill);
      grad.addColorStop(1, c.stroke);
      const halo = ctx.createRadialGradient(px, py, r*0.5, px, py, r*2.2);
      halo.addColorStop(0, c.fill+'44'); halo.addColorStop(1, c.fill+'00');
      ctx.beginPath(); ctx.arc(px, py, r*2.2, 0, Math.PI*2);
      ctx.fillStyle = halo; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI*2);
      ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = c.hi+'88'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(px-r*0.28, py-r*0.28, r*0.22, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
    }

    let localShowLabels = showLabels, localShowGrid = showGrid,
        localShowSurface = showSurface, localShowStems = showStems,
        localAutoSpeed = autoSpeed;

    function draw() {
      const W = wrap.clientWidth, H = wrap.clientHeight;
      ctx.clearRect(0, 0, W, H);
      const gridC = 'rgba(255,255,255,0.07)', axisC = 'rgba(255,255,255,0.2)', lblC = 'rgba(255,255,255,0.5)';

      if (localShowGrid) {
        ctx.lineWidth = 0.5;
        for (let e=-5;e<=5;e++) {
          ctx.strokeStyle = e===0 ? 'rgba(255,255,255,0.2)' : gridC;
          ctx.lineWidth = e===0 ? 1 : 0.5;
          const a=project(e,-5,0), b=project(e,5,0);
          ctx.beginPath(); ctx.moveTo(a.px,a.py); ctx.lineTo(b.px,b.py); ctx.stroke();
        }
        for (let a=-5;a<=5;a++) {
          ctx.strokeStyle = a===0 ? 'rgba(255,255,255,0.2)' : gridC;
          ctx.lineWidth = a===0 ? 1 : 0.5;
          const p1=project(-5,a,0), p2=project(5,a,0);
          ctx.beginPath(); ctx.moveTo(p1.px,p1.py); ctx.lineTo(p2.px,p2.py); ctx.stroke();
        }
      }

      // Quadrant labels
      ctx.font = '11px var(--font-mono, monospace)';
      [
        {e:3.2,a:3.8,t:'AUTH RIGHT'},{e:-3.2,a:3.8,t:'AUTH LEFT'},
        {e:3.2,a:-3.8,t:'LIB RIGHT'},{e:-3.2,a:-3.8,t:'LIB LEFT'},
      ].forEach(({e,a,t}) => {
        const p = project(e,a,0);
        ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.textAlign='center'; ctx.fillText(t,p.px,p.py);
      });

      // Axis labels
      ctx.fillStyle = lblC;
      [{e:5.6,a:0,s:0,t:'Right →',al:'left'},{e:-5.6,a:0,s:0,t:'← Left',al:'right'},
       {e:0,a:5.4,s:0,t:'Authoritarian',al:'center'},{e:0,a:-5.4,s:0,t:'Libertarian',al:'center'},
       {e:0,a:0,s:103,t:'100% cultiness',al:'center'},{e:0,a:0,s:0,t:'0%',al:'center'}
      ].forEach(({e,a,s,t,al}) => {
        const p=project(e,a,s); ctx.textAlign=al; ctx.fillText(t,p.px,p.py);
      });

      if (localShowSurface) {
        for (let ai=-6;ai<6;ai++) for (let ei=-6;ei<6;ei++) {
          const a0=ai/6*5, a1=(ai+1)/6*5, e0=ei/6*5, e1=(ei+1)/6*5;
          const sc=a=>Math.max(0,Math.min(100,(a/5+0.5)*70+15));
          const p1=project(e0,a0,sc(a0)),p2=project(e1,a0,sc(a0));
          const p3=project(e1,a1,sc(a1)),p4=project(e0,a1,sc(a1));
          ctx.beginPath(); ctx.moveTo(p1.px,p1.py); ctx.lineTo(p2.px,p2.py);
          ctx.lineTo(p3.px,p3.py); ctx.lineTo(p4.px,p4.py); ctx.closePath();
          ctx.fillStyle='rgba(100,120,255,0.05)'; ctx.strokeStyle='rgba(100,120,255,0.1)';
          ctx.lineWidth=0.3; ctx.fill(); ctx.stroke();
        }
      }

      const sorted = orgs.map(org => ({ ...project(org.econ,org.auth,org.score), org }))
        .sort((a,b)=>b.depth-a.depth);

      if (localShowStems) {
        sorted.forEach(({px,py,org}) => {
          const p0=project(org.econ,org.auth,0);
          const c=TC[org.tier]||TC['Not Culty'];
          ctx.beginPath(); ctx.moveTo(p0.px,p0.py); ctx.lineTo(px,py);
          ctx.strokeStyle=c.fill+'28'; ctx.lineWidth=0.8; ctx.stroke();
          ctx.beginPath(); ctx.arc(p0.px,p0.py,2,0,Math.PI*2);
          ctx.fillStyle=c.fill+'55'; ctx.fill();
        });
      }

      ptsRef.current = [];
      sorted.forEach(({px,py,scale,org}) => {
        const c=TC[org.tier]||TC['Not Culty'];
        const r=Math.max(4,7*(0.65+(org.score/100)*0.5)*Math.max(0.5,scale));
        drawDot(px,py,r,c);
        if (org.score>=85) {
          ctx.beginPath(); ctx.arc(px,py,r+4,0,Math.PI*2);
          ctx.strokeStyle=c.fill+'44'; ctx.lineWidth=1.5; ctx.stroke();
        }
        if (localShowLabels) {
          ctx.font=`${Math.max(10,Math.round(10*scale))}px var(--font-mono,monospace)`;
          ctx.fillStyle=lblC; ctx.textAlign='left';
          ctx.fillText(org.name,px+r+3,py+4);
        }
        ptsRef.current.push({px,py,org});
      });
    }

    function loop() {
      if (!dragRef.current.dragging) camRef.current.h += localAutoSpeed*0.0008;
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    const unsub = setInterval(() => {
      localShowLabels  = showLabels;
      localShowGrid    = showGrid;
      localShowSurface = showSurface;
      localShowStems   = showStems;
      localAutoSpeed   = autoSpeed;
    }, 100);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(unsub);
      ro.disconnect();
    };
  }, [orgs]);

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column' }}>
      <div style={{ borderBottom:'1px solid rgba(212,206,196,0.1)', padding:'1.25rem 0 0.9rem',
        background:'var(--ink)', position:'sticky', top:'60px', zIndex:50 }}>
        <div className="container--wide">
          <div style={{ display:'flex', alignItems:'baseline', gap:'0.5rem', marginBottom:'0.75rem' }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:'0.6rem', letterSpacing:'0.15em',
              textTransform:'uppercase', color:'var(--gold)' }}>
              <Link href="/explore" style={{color:'var(--gold)'}}>Explorer</Link> —
            </span>
            <h1 style={{ fontFamily:'var(--serif)', fontSize:'clamp(1.2rem,2.5vw,1.8rem)',
              color:'var(--paper)', display:'inline', marginLeft:'0.4rem' }}>
              3D Political Compass
            </h1>
          </div>
          <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
            <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer',
              fontFamily:'var(--mono)', fontSize:'0.62rem', color:'var(--muted)' }}>
              <input type="checkbox" checked={showGrid} onChange={e=>setShowGrid(e.target.checked)}
                style={{accentColor:'var(--gold)'}} /> Grid
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer',
              fontFamily:'var(--mono)', fontSize:'0.62rem', color:'var(--muted)' }}>
              <input type="checkbox" checked={showStems} onChange={e=>setShowStems(e.target.checked)}
                style={{accentColor:'var(--gold)'}} /> Depth stems
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer',
              fontFamily:'var(--mono)', fontSize:'0.62rem', color:'var(--muted)' }}>
              <input type="checkbox" checked={showSurface} onChange={e=>setShowSurface(e.target.checked)}
                style={{accentColor:'var(--gold)'}} /> Trend surface
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer',
              fontFamily:'var(--mono)', fontSize:'0.62rem', color:'var(--muted)' }}>
              <input type="checkbox" checked={showLabels} onChange={e=>setShowLabels(e.target.checked)}
                style={{accentColor:'var(--gold)'}} /> Labels
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:'0.5rem',
              fontFamily:'var(--mono)', fontSize:'0.62rem', color:'var(--muted)' }}>
              Rotate
              <input type="range" min="0" max="3" step="0.1" value={autoSpeed}
                onChange={e=>setAutoSpeed(+e.target.value)}
                style={{width:80, accentColor:'var(--gold)'}} />
            </label>
            <span style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', color:'var(--muted)', marginLeft:'auto' }}>
              Drag to rotate · scroll to zoom · depth = cultiness score
            </span>
          </div>
        </div>
      </div>

      <div ref={wrapRef} style={{ flex:1, minHeight:520, background:'#0d1117',
        position:'relative', cursor:'grab' }}>
        <canvas ref={canvasRef} style={{ display:'block', width:'100%', height:'100%' }} />
        {loading && (
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
            justifyContent:'center', background:'rgba(13,17,23,0.8)' }}>
            <span style={{ fontFamily:'var(--mono)', fontSize:'0.75rem', color:'var(--gold)', letterSpacing:'0.2em' }}>
              LOADING…
            </span>
          </div>
        )}
        {hovered && (
          <div style={{ position:'absolute', left: Math.min(ttPos.x+16, (wrapRef.current?.clientWidth||600)-230),
            top: Math.max(ttPos.y-10, 4),
            background:'var(--ink)', border:'1px solid rgba(212,206,196,0.15)',
            borderRadius:6, padding:'10px 14px', pointerEvents:'none', minWidth:200, zIndex:20 }}>
            <div style={{ fontFamily:'var(--mono)', fontSize:'0.82rem', fontWeight:700,
              color:'var(--paper)', marginBottom:4 }}>{hovered.name}</div>
            <div style={{ fontFamily:'var(--mono)', fontSize:'0.62rem',
              color: TC[hovered.tier]?.fill || 'var(--gold)', marginBottom:6 }}>{hovered.tier}</div>
            {[['Cultiness', hovered.score+'%'], ['Economic', (hovered.econ>0?'+':'')+hovered.econ],
              ['Authority', (hovered.auth>0?'+':'')+hovered.auth], ['Category', hovered.cat]
            ].map(([k,v])=>(
              <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:12,
                fontFamily:'var(--mono)', fontSize:'0.6rem', color:'var(--muted)', marginTop:2 }}>
                <span>{k}</span><span style={{color:'var(--paper)'}}>{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ borderTop:'1px solid rgba(212,206,196,0.08)', padding:'0.75rem 0',
        background:'rgba(244,240,232,0.01)' }}>
        <div className="container--wide">
          <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', alignItems:'center' }}>
            {TIERS.map(t=>(
              <div key={t} style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:TC[t]?.fill }} />
                <span style={{ fontFamily:'var(--mono)', fontSize:'0.58rem', color:'rgba(212,206,196,0.45)' }}>{t}</span>
              </div>
            ))}
            <span style={{ fontFamily:'var(--mono)', fontSize:'0.56rem', color:'rgba(212,206,196,0.25)', marginLeft:'auto' }}>
              X = economic · Y = authority · Z depth = cultiness
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
