import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Download, Heart, Image as ImageIcon,
  LockKeyhole, Maximize2, Search, Sparkles, X,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import "./Gallery.scss";

const dateLabel = (value) => new Date(`${value}T12:00:00+05:30`).toLocaleDateString(
  "en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" },
);

function Pagination({ data, page, change, busy = false }) {
  if (!data || (!data.previous && !data.next)) return null;
  return (
    <nav className="cg__pagination" aria-label="Gallery pages">
      <button className="cg__button cg__button--outline" disabled={!data.previous || busy} onClick={() => change(page - 1)}>
        <ArrowLeft size={15} /> Previous
      </button>
      <span>Page {page}</span>
      <button className="cg__button cg__button--outline" disabled={!data.next || busy} onClick={() => change(page + 1)}>
        Next <ArrowRight size={15} />
      </button>
    </nav>
  );
}

function PrivateImage({ photo, className = "" }) {
  const { apiBlobRequest } = useAuth();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const container = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    let objectURL = "";
    let started = false;
    const load = () => {
      if (started) return;
      started = true;
      apiBlobRequest(`galleries/photos/${photo.id}/file/`, { signal: controller.signal })
        .then((blob) => {
          if (controller.signal.aborted) return;
          objectURL = URL.createObjectURL(blob);
          setUrl(objectURL);
        })
        .catch((err) => {
          if (!controller.signal.aborted) setError(err.message);
        });
    };
    let observer;
    if (typeof IntersectionObserver === "undefined") load();
    else {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          load(); observer.disconnect();
        }
      }, { rootMargin: "250px" });
      if (container.current) observer.observe(container.current);
    }
    return () => {
      controller.abort(); observer?.disconnect();
      if (objectURL) URL.revokeObjectURL(objectURL);
    };
  }, [photo.id, apiBlobRequest, attempt]);

  return (
    <div ref={container} className={`cg__private-image ${className}`}>
      {url ? <img src={url} alt={photo.alt_text || photo.title} decoding="async" /> : (
        <div className={`cg__image-state ${error ? "" : "cg__image-state--loading"}`}>
          <ImageIcon size={24} aria-hidden="true" />
          <span>{error ? "Photo unavailable" : "Loading photograph"}</span>
          {error && <button type="button" className="cg__button cg__button--outline" onClick={() => {
            setError(""); setAttempt((value) => value + 1);
          }}>Retry image</button>}
        </div>
      )}
    </div>
  );
}

function Lightbox({ photo, photos, close, choose, favorite, busy, download, downloading, allowDownloads }) {
  const dialog = useRef(null);
  const index = photos.findIndex((item) => item.id === photo.id);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!previousFocus.current) previousFocus.current = document.activeElement;
    const node = dialog.current;
    const oldOverflow = document.body.style.overflow;
    if (!node.open) node.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = oldOverflow;
      if (previousFocus.current?.isConnected) previousFocus.current.focus();
    };
  }, []);

  function move(direction) {
    choose(photos[(index + direction + photos.length) % photos.length].id);
  }
  return (
    <dialog ref={dialog} className="cg-viewer" aria-label={photo.title}
      onClose={close} onCancel={close}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLButtonElement && event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
        if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
      }}>
      <div className="cg-viewer__shell">
        <header>
          <span className="cg__eyebrow">YOUR PRIVATE COLLECTION</span>
          <button className="cg__icon" type="button" onClick={close} aria-label="Close photograph"><X size={21} /></button>
        </header>
        <div className="cg-viewer__stage">
          <button className="cg__icon" type="button" onClick={() => move(-1)} disabled={photos.length < 2} aria-label="Previous photograph"><ArrowLeft size={21} /></button>
          <PrivateImage key={photo.id} photo={photo} className="cg-viewer__image" />
          <button className="cg__icon" type="button" onClick={() => move(1)} disabled={photos.length < 2} aria-label="Next photograph"><ArrowRight size={21} /></button>
        </div>
        <footer>
          <div><span>{index + 1} / {photos.length} on this page</span><h2>{photo.title}</h2></div>
          <div className="cg__actions">
            <button className="cg__button cg__button--outline" type="button" disabled={busy} aria-pressed={photo.is_favorite} onClick={() => favorite(photo)}>
              <Heart size={16} fill={photo.is_favorite ? "currentColor" : "none"} />
              {photo.is_favorite ? "Saved" : "Save favourite"}
            </button>
            {allowDownloads && <button className="cg__button" type="button" disabled={downloading} onClick={() => download(photo)}>
              <Download size={16} /> {downloading ? "Preparing…" : "Download"}
            </button>}
          </div>
        </footer>
      </div>
    </dialog>
  );
}

function Collection({ gallery, back }) {
  const { apiRequest, apiBlobRequest } = useAuth();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [draftSearch, setDraftSearch] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const mutationLock = useRef(false);
  const downloadLock = useRef(false);
  const alive = useRef(false);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), search: query, favorites: onlyFavorites ? "1" : "0" });
    apiRequest(`galleries/${gallery.id}/photos/?${params}`, { signal: controller.signal })
      .then((result) => {
        if (!Array.isArray(result.results)) throw new Error("Invalid photographs response.");
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [apiRequest, gallery.id, page, query, onlyFavorites, retry]);

  function resetView() { setData(null); setError(""); setSelected(null); }
  function changePage(value) { resetView(); setPage(value); }
  async function favorite(photo) {
    if (mutationLock.current) return;
    mutationLock.current = true; setBusy(photo.id); setNotice(null);
    try {
      const result = await apiRequest(`galleries/photos/${photo.id}/favorite/`, {
        method: "PUT", body: JSON.stringify({ is_favorite: !photo.is_favorite }),
      });
      if (!alive.current) return;
      if (typeof result.is_favorite !== "boolean") throw new Error("Unable to confirm favourite selection.");
      if (onlyFavorites && !result.is_favorite) {
        resetView();
        if (data.results.length === 1 && page > 1) setPage(page - 1);
        else setRetry((value) => value + 1);
      } else {
        setData((current) => ({ ...current, results: current.results.map((item) => item.id === photo.id ? { ...item, is_favorite: result.is_favorite } : item) }));
      }
      setNotice({ error: false, text: result.is_favorite ? "Photograph saved to favourites." : "Photograph removed from favourites." });
    } catch (err) { if (alive.current) setNotice({ error: true, text: err.message }); }
    finally { mutationLock.current = false; if (alive.current) setBusy(null); }
  }
  async function download(photo) {
    if (downloadLock.current) return;
    downloadLock.current = true; setDownloading(true); setNotice(null);
    try {
      const blob = await apiBlobRequest(`galleries/photos/${photo.id}/file/?download=1`);
      if (!alive.current) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `${photo.id}.jpg`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
      setNotice({ error: false, text: "Your download has started." });
    } catch (err) { if (alive.current) setNotice({ error: true, text: err.message }); }
    finally { downloadLock.current = false; if (alive.current) setDownloading(false); }
  }
  const photos = data?.results || [];
  const currentPhoto = photos.find((photo) => photo.id === selected);

  return (
    <section className="cg__collection" aria-labelledby="collection-title">
      <button className="cg__back" type="button" onClick={back}><ArrowLeft size={16} /> All collections</button>
      <div className="cg__section-heading">
        <div><span className="cg__eyebrow">{gallery.service_name} · {dateLabel(gallery.session_date)}</span><h2 id="collection-title">{gallery.title}</h2><p>{gallery.description}</p></div>
        <span className="cg__badge"><LockKeyhole size={14} /> {gallery.allow_downloads ? "Downloads enabled" : "Viewing collection"}</span>
      </div>
      <div className="cg__toolbar">
        <div className="cg__tabs" role="group" aria-label="Photograph filter">
          {[false, true].map((value) => <button key={String(value)} type="button" disabled={Boolean(busy)} aria-pressed={onlyFavorites === value} onClick={() => {
            if (onlyFavorites === value) return;
            resetView(); setPage(1); setOnlyFavorites(value);
          }}>{value ? <><Heart size={14} /> Favourites</> : "All photographs"}</button>)}
        </div>
        <form className="cg__search" role="search" onSubmit={(event) => {
          event.preventDefault(); if (busy || query === draftSearch.trim()) return;
          resetView(); setPage(1); setQuery(draftSearch.trim());
        }}>
          <input aria-label="Search photo titles" placeholder="Find a moment…" value={draftSearch} maxLength={150} onChange={(event) => setDraftSearch(event.target.value)} />
          <button type="submit" disabled={Boolean(busy)} aria-label="Search photographs"><Search size={18} /></button>
        </form>
      </div>
      {notice && <p className={`cg__notice ${notice.error ? "cg__notice--error" : ""}`} role={notice.error ? "alert" : "status"}>{notice.text}</p>}
      {error ? <div className="cg__empty"><h3>We couldn't open this collection.</h3><p role="alert">{error}</p><button className="cg__button" onClick={() => { resetView(); setRetry((value) => value + 1); }}>Try again</button></div>
        : !data ? <div className="cg__empty" role="status"><span className="cg__loader" /> Opening your collection…</div>
        : !photos.length ? <div className="cg__empty"><ImageIcon size={30} /><h3>{onlyFavorites ? "Your favourites start here." : query ? "No matching photographs." : "Your photographs are on their way."}</h3><p>{onlyFavorites ? "Save the frames you love using the heart button." : query ? "Search another title or clear your search." : "Photos will appear when the studio adds them to this collection."}</p>{(query || onlyFavorites) && <button className="cg__button cg__button--outline" onClick={() => { resetView(); setPage(1); setQuery(""); setDraftSearch(""); setOnlyFavorites(false); }}>Show all photographs</button>}</div>
        : <>
          <p className="cg__result-count">{data.count} {onlyFavorites ? "saved photographs" : "photographs"}{query ? " matching your search" : ""}</p>
          <div className="cg__grid">
            {photos.map((photo, index) => <article className="cg__photo" key={photo.id} style={{ "--i": index }}>
              <div className="cg__photo-frame">
                <PrivateImage photo={photo} />
                <button className="cg__open" type="button" onClick={() => setSelected(photo.id)} aria-label={`View ${photo.title}`}><Maximize2 size={20} /><span>View photograph</span></button>
                <button className={`cg__favorite ${photo.is_favorite ? "is-saved" : ""}`} type="button" disabled={Boolean(busy)} aria-pressed={photo.is_favorite} aria-label={`${photo.is_favorite ? "Remove" : "Save"} ${photo.title} ${photo.is_favorite ? "from" : "to"} favourites`} onClick={() => favorite(photo)}><Heart size={17} fill={photo.is_favorite ? "currentColor" : "none"} /></button>
              </div>
              <div className="cg__caption"><h3>{photo.title}</h3><button className="cg__icon" type="button" onClick={() => setSelected(photo.id)} aria-label={`Open ${photo.title}`}><ArrowRight size={18} /></button></div>
            </article>)}
          </div>
          <Pagination data={data} page={page} change={changePage} busy={Boolean(busy)} />
        </>}
      {currentPhoto && <Lightbox photo={currentPhoto} photos={photos} choose={setSelected} close={() => setSelected(null)} favorite={favorite} busy={Boolean(busy)} download={download} downloading={downloading} allowDownloads={gallery.allow_downloads} />}
    </section>
  );
}

export default function Gallery() {
  const { apiRequest } = useAuth();
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState("");
  const [gallery, setGallery] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest(`galleries/?page=${page}`, { signal: controller.signal })
      .then((result) => {
        if (!Array.isArray(result.results)) throw new Error("Invalid collections response.");
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err) => { if (!controller.signal.aborted) setError(err.message); });
    return () => controller.abort();
  }, [apiRequest, page, retry]);

  return (
    <div className="cg">
      <header className="cg__hero" onPointerMove={(event) => {
        if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty("--px", `${((event.clientX - rect.left) / rect.width - 0.5) * 14}px`);
        event.currentTarget.style.setProperty("--py", `${((event.clientY - rect.top) / rect.height - 0.5) * 10}px`);
      }} onPointerLeave={(event) => {
        event.currentTarget.style.setProperty("--px", "0px"); event.currentTarget.style.setProperty("--py", "0px");
      }}>
        <div className="cg__hero-copy">
          <span className="cg__eyebrow"><span className="cg__dot" /> THE PRIVATE ARCHIVE</span>
          <h1>A moment lived.<br /><em>A memory kept.</em></h1>
          <p>Your photographs, thoughtfully collected. Return to the frames that feel like home.</p>
          <span className="cg__privacy"><LockKeyhole size={14} /> Your account. Your collections.</span>
        </div>
        <div className="cg__art" aria-hidden="true">
          <div className="cg__orbit" /><div className="cg__art-card cg__art-card--back" />
          <div className="cg__art-card"><Sparkles size={36} strokeWidth={1} /><span>little click</span><small>THE ART OF REMEMBERING</small></div>
          <span className="cg__edition">SOUTH BOPAL · AHMEDABAD</span>
        </div>
      </header>
      {gallery ? <Collection key={gallery.id} gallery={gallery} back={() => setGallery(null)} /> : <section className="cg__collection" aria-labelledby="gallery-heading">
        <div className="cg__section-heading"><div><span className="cg__eyebrow">CURATED FOR YOU</span><h2 id="gallery-heading">Your collections</h2><p>A home for the photographs worth returning to.</p></div>{data && <span className="cg__badge"><ImageIcon size={15} /> {data.count} collections</span>}</div>
        {error ? <div className="cg__empty"><h3>Unable to load your collections.</h3><p role="alert">{error}</p><button className="cg__button" onClick={() => { setData(null); setError(""); setRetry((value) => value + 1); }}>Try again</button></div>
          : !data ? <div className="cg__empty" role="status"><span className="cg__loader" /> Loading your private archive…</div>
          : !data.results.length ? <div className="cg__empty"><ImageIcon size={32} strokeWidth={1.3} /><span className="cg__eyebrow">THE NEXT CHAPTER</span><h3>Your story is still unfolding.</h3><p>Your collections will appear here when the studio publishes your photographs.</p><Link className="cg__button cg__button--outline" to="/dashboard/bookings">View my bookings <ArrowRight size={16} /></Link></div>
          : <><div className="cg__albums">{data.results.map((item, index) => <button className="cg__album" type="button" key={item.id} onClick={() => setGallery(item)}>
            <div className="cg__album-art"><span>{String((page - 1) * 12 + index + 1).padStart(2, "0")}</span><ImageIcon size={44} strokeWidth={0.8} /><small>{item.service_name}</small></div>
            <div className="cg__album-copy"><span className="cg__eyebrow">{dateLabel(item.session_date)}</span><h3>{item.title}</h3><p>{item.photo_count} photographs</p><span className="cg__album-open">Open collection <ArrowRight size={16} /></span></div>
          </button>)}</div><Pagination data={data} page={page} change={(value) => { setData(null); setError(""); setPage(value); }} /></>}
      </section>}
      <footer className="cg__footer"><Sparkles size={18} strokeWidth={1.3} /><p>For the moments that become everything.</p><span>LITTLE CLICK STUDIO</span></footer>
    </div>
  );
}
