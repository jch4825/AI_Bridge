import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { ChevronDown, ExternalLink, Link2, Search, Star, X } from 'lucide-react';
import { resourceCategories, type ResourceCategory, type ResourceItem, type ResourceSubCategory } from '../data/resourcesData';
import { useFavoritesList } from '../hooks/useFavoritesList';

const CATEGORY_ORDER = [
  'school-admin-support',
  'policy',
  'ai-basics',
  'ethics',
  'lesson',
  'research-etc',
  'ai-industry-experts',
];

const FEATURED_ITEM_ID = 'r-3-4';
const STRONG_RECOMMENDED_ITEM_ID = 'edzip';

const CATEGORY_DISPLAY: Record<string, { title: string; subtitle: string }> = {
  'school-admin-support': {
    title: '핵심 도움 자료',
    subtitle: '학교 업무 전반에서 꼭 확인해야 할 핵심 도움 자료',
  },
  policy: {
    title: '정책·지침',
    subtitle: '교육부·시도교육청 AI 정책 자료',
  },
  'ai-basics': {
    title: 'AI 기초 이해',
    subtitle: '주요 AI 서비스와 기초 이해 자료',
  },
  ethics: {
    title: 'AI 윤리·안전',
    subtitle: 'AI 윤리, 저작권, 편향, 안전 자료',
  },
  lesson: {
    title: '수업 지원',
    subtitle: '지도안·활동지·수업 자료',
  },
  'research-etc': {
    title: '연구·연수·뉴스',
    subtitle: '학술 연구·교사 연수·AI 뉴스 동향',
  },
  'ai-industry-experts': {
    title: 'AI 산업·전문가 자료',
    subtitle: '한국 AI 기업·개발자 도구·의료 AI·공공기관 (전문가 참고용)',
  },
};

const CATEGORY_DOOR_PALETTE: Record<string, { base: string; shade: string; accent: string }> = {
  'school-admin-support': { base: '#fef3c7', shade: '#fde68a', accent: '#d97706' },
  'ai-basics': { base: '#dbeafe', shade: '#bfdbfe', accent: '#2563eb' },
  'ethics': { base: '#fee2e2', shade: '#fecaca', accent: '#ef4444' },
  'lesson': { base: '#ede9fe', shade: '#ddd6fe', accent: '#7c3aed' },
  'policy': { base: '#f1f5f9', shade: '#e2e8f0', accent: '#475569' },
  'research-etc': { base: '#dcfce7', shade: '#bbf7d0', accent: '#16a34a' },
  'ai-industry-experts': { base: '#e0e7ff', shade: '#c7d2fe', accent: '#4f46e5' },
};

const DEFAULT_DOOR_PALETTE = { base: '#f1f5f9', shade: '#e2e8f0', accent: '#475569' };

const DEFAULT_OPEN_CATEGORIES = new Set(['school-admin-support']);

const TAG_RULES: Array<{ tag: string; pattern: RegExp }> = [
  { tag: '초등', pattern: /초등/ },
  { tag: '한글·문해', pattern: /한글|문해/ },
  { tag: '정책', pattern: /정책|기본계획|행동계획|추진 계획|관리 가이드|안내서/ },
  { tag: '법령', pattern: /기본법|시행령|법령|법률|조항/ },
  { tag: '윤리·안전', pattern: /윤리|안전|개인정보|과의존|편향|저작권/ },
  { tag: '시뮬레이션', pattern: /시뮬레이션|실험실|가상 실험|VlabON/i },
  { tag: '코딩', pattern: /코딩|프로그래밍|스크래치|엔트리|블록 코딩/i },
  { tag: '디자인', pattern: /디자인|만화|드로잉|UI/i },
  { tag: '음성·소리', pattern: /음성|음악|TTS|더빙|노래|작곡/ },
  { tag: '로컬 AI', pattern: /로컬|Ollama|LM Studio|GPT4ALL|Open WebUI|Jan/i },
  { tag: '노코드', pattern: /노코드|코드 없는|No Code|Teachable Machine|Brightics/i },
  { tag: '출판사', pattern: /출판사|미래엔|아이스크림|비상교육|비바샘|씨마스|천재교육/ },
  { tag: '시도교육청', pattern: /시도교육청|광주|울산|경상남도교육청|서울시교육청|충청남도교육청/ },
  { tag: '연구', pattern: /학술|논문|학회|연구보고서/ },
  { tag: '연수', pattern: /연수/ },
  { tag: '행정', pattern: /행정|학교업무|학교 업무|생기부|학습발달|업무 도움/ },
  { tag: '수학', pattern: /수학/ },
  { tag: '과학', pattern: /과학/ },
  { tag: '영상', pattern: /영상|유튜브|동영상|영화/ },
  { tag: '해외', pattern: /\(해외\)/ },
  { tag: '뉴스', pattern: /뉴스|매체|미디어|보도|동향/ },
  { tag: '의료', pattern: /의료|병리|뇌질환|신약|바이오|헬스케어|진단/ },
  { tag: 'LLM', pattern: /LLM|초거대|챗봇|대화형 AI/ },
  { tag: '개발자', pattern: /개발자|프레임워크|API|RAG|MLOps|GPU|반도체|코딩 AI/ },
];

function getDisplayCategory(category: ResourceCategory): ResourceCategory {
  const display = CATEGORY_DISPLAY[category.id];
  return display ? { ...category, ...display } : category;
}

function getHostName(url?: string) {
  if (!url) return '링크 준비 중';
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getCategoryCount(category: ResourceCategory) {
  return category.subCategories.reduce((sum, sub) => sum + sub.items.length, 0);
}

function getItemTags(catTitle: string, subLabel: string, item: ResourceItem): string[] {
  const text = `${catTitle} ${subLabel} ${item.title} ${item.description ?? ''}`;
  return TAG_RULES.filter(r => r.pattern.test(text)).map(r => r.tag);
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-yellow-200/70 px-0.5 text-gray-900">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function ResourceCard({
  item,
  isFav,
  onToggleFav,
  breadcrumb,
  query = '',
}: {
  item: ResourceItem;
  isFav: boolean;
  onToggleFav: () => void;
  breadcrumb?: string;
  query?: string;
}) {
  const isFeatured = item.id === FEATURED_ITEM_ID;
  const isStrongRecommended = item.id === STRONG_RECOMMENDED_ITEM_ID;
  const hasUrl = !!item.url;

  const containerBgClass = isFeatured
    ? 'bg-amber-50/80 border-amber-200'
    : isStrongRecommended
      ? 'bg-emerald-50/80 border-emerald-200'
      : 'bg-white border-gray-200';

  const iconWrapClass = isFeatured
    ? 'bg-amber-100 text-amber-700 ring-amber-200'
    : isStrongRecommended
      ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
      : 'bg-gray-50 text-gray-400 ring-gray-200';

  const titleClass = isFeatured
    ? 'text-amber-950 group-hover:text-amber-800'
    : isStrongRecommended
      ? 'text-emerald-950 group-hover:text-emerald-800'
      : 'text-gray-900 group-hover:text-canva-purple';

  const descClass = isFeatured
    ? 'text-amber-900/80'
    : isStrongRecommended
      ? 'text-emerald-900/80'
      : 'text-gray-500';

  const hostClass = isFeatured
    ? 'text-amber-700/80'
    : isStrongRecommended
      ? 'text-emerald-700/80'
      : 'text-gray-400';

  const cardClass =
    `group relative flex items-start gap-3 ${containerBgClass} border rounded-xl px-3 py-3 pr-12 text-left transition-all hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-canva-purple/30 ${hasUrl ? '' : 'opacity-65 cursor-default'}`;

  const inner = (
    <>
      <span
        className={`shrink-0 mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${iconWrapClass}`}
      >
        {hasUrl ? <ExternalLink size={18} /> : <Link2 size={18} />}
      </span>
      <span className="min-w-0 flex-1">
        {breadcrumb && (
          <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {breadcrumb}
          </span>
        )}
        {isFeatured && (
          <span className="mb-1 inline-flex rounded-full bg-amber-200/70 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
            필수 확인
          </span>
        )}
        {isStrongRecommended && (
          <span className="mb-1 inline-flex rounded-full bg-emerald-200/70 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
            강력 추천
          </span>
        )}
        <span className={`block text-sm font-bold leading-tight transition-colors ${titleClass}`}>
          {highlight(item.title, query)}
        </span>
        {item.description && (
          <span className={`mt-1 block text-[11px] leading-snug ${descClass}`}>
            {highlight(item.description, query)}
          </span>
        )}
        <span className={`mt-1.5 block truncate text-[10px] font-mono ${hostClass}`}>
          {getHostName(item.url)}
        </span>
      </span>
    </>
  );

  return (
    <div className="relative">
      {hasUrl ? (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cardClass}
        >
          {inner}
        </a>
      ) : (
        <div className={cardClass}>{inner}</div>
      )}
      <button
        type="button"
        onClick={onToggleFav}
        aria-label={isFav ? '즐겨찾기 해제' : '즐겨찾기에 추가'}
        title={isFav ? '즐겨찾기 해제' : '즐겨찾기에 추가'}
        className={`absolute right-1.5 top-1.5 z-10 rounded-full p-2 transition ${
          isFav
            ? 'text-amber-400 hover:bg-amber-50'
            : isFeatured
              ? 'text-amber-600/80 hover:bg-amber-200/60 hover:text-amber-700'
              : isStrongRecommended
                ? 'text-emerald-600/80 hover:bg-emerald-200/60 hover:text-emerald-700'
                : 'text-gray-400 hover:bg-gray-100 hover:text-amber-500'
        }`}
      >
        <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}

function SubCategoryDoor({
  subCategory,
  categoryId,
  favorites,
  onToggleFav,
}: {
  subCategory: ResourceSubCategory;
  categoryId: string;
  favorites: string[];
  onToggleFav: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(DEFAULT_OPEN_CATEGORIES.has(categoryId));
  const total = subCategory.items.length;
  const palette = CATEGORY_DOOR_PALETTE[categoryId] ?? DEFAULT_DOOR_PALETTE;

  const itemPositions = [
    { x: '1.9rem', y: '-0.95rem' },
    { x: '2.65rem', y: '0.05rem' },
    { x: '1.9rem', y: '1.05rem' },
  ];

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={() => setIsOpen(v => !v)}
        aria-expanded={isOpen}
        className={`resource-card group flex min-h-24 w-full items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-canva-purple/30 ${
          isOpen ? 'border-canva-purple ring-2 ring-canva-purple/15' : 'border-gray-200'
        }`}
      >
        <span
          className="tool-palette-scene"
          aria-hidden="true"
          data-open={isOpen}
          style={{
            '--palette-base': palette.base,
            '--palette-shade': palette.shade,
            '--palette-accent': palette.accent,
          } as React.CSSProperties}
        >
          <span className="tool-palette-wrap">
            <span className="tool-palette-base">
              <span className="tool-palette-shine" />
              <span className="tool-palette-symbol text-base leading-none">
                {subCategory.iconEmoji}
              </span>
            </span>
            {itemPositions.map((pos, index) => (
              <span
                key={index}
                className="tool-palette-item"
                style={{
                  '--palette-item-index': index,
                  '--palette-item-x': pos.x,
                  '--palette-item-y': pos.y,
                } as React.CSSProperties}
              />
            ))}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-extrabold text-gray-900">{subCategory.label}</span>
          <span className="mt-1 block text-[11px] font-bold text-canva-purple">{total}개 자료</span>
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-canva-purple' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <m.section
            key={`${subCategory.id}-panel`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="mt-2 max-h-[70vh] overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-4 py-3">
                <h3 className="text-sm font-extrabold text-gray-900">{subCategory.label}</h3>
              </div>
              <div className="p-3">
                {total === 0 ? (
                  <p className="px-1 py-6 text-center text-xs text-gray-400">자료 준비 중</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {subCategory.items.map(item => (
                      <ResourceCard
                        key={item.id}
                        item={item}
                        isFav={favorites.includes(item.id)}
                        onToggleFav={() => onToggleFav(item.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </m.section>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TaggedEntry {
  item: ResourceItem;
  categoryTitle: string;
  subCategoryLabel: string;
  tags: string[];
  key: string;
}

export default function Resources() {
  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<Set<string>>(() => new Set());
  const [showFavOnly, setShowFavOnly] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const { favorites, toggle: toggleFav } = useFavoritesList('resource');

  const orderedCategories = useMemo(
    () =>
      [...resourceCategories]
        .sort((a, b) => CATEGORY_ORDER.indexOf(a.id) - CATEGORY_ORDER.indexOf(b.id))
        .map(getDisplayCategory)
        .filter(category => getCategoryCount(category) > 0),
    []
  );

  const taggedItems: TaggedEntry[] = useMemo(() => {
    const out: TaggedEntry[] = [];
    for (const category of orderedCategories) {
      for (const sub of category.subCategories) {
        for (const item of sub.items) {
          out.push({
            item,
            categoryTitle: category.title,
            subCategoryLabel: sub.label,
            tags: getItemTags(category.title, sub.label, item),
            key: `${category.id}-${sub.id}-${item.id}`,
          });
        }
      }
    }
    return out;
  }, [orderedCategories]);

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of taggedItems) {
      for (const tag of t.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [taggedItems]);

  const normalizedQuery = query.trim().toLowerCase();
  const isFiltering = normalizedQuery.length > 0 || activeTags.size > 0 || showFavOnly;
  const visibleTagCounts = showAllTags ? tagCounts : tagCounts.slice(0, 8);

  const filteredResults = useMemo(() => {
    if (!isFiltering) return [];
    return taggedItems.filter(({ item, categoryTitle, subCategoryLabel, tags }) => {
      if (showFavOnly && !favorites.includes(item.id)) return false;
      if (activeTags.size > 0 && !tags.some(t => activeTags.has(t))) return false;
      if (normalizedQuery) {
        const haystack = [
          categoryTitle,
          subCategoryLabel,
          item.title,
          item.description ?? '',
          item.url ?? '',
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedQuery)) return false;
      }
      return true;
    });
  }, [isFiltering, taggedItems, showFavOnly, favorites, activeTags, normalizedQuery]);

  const favoriteEntries = useMemo(
    () => taggedItems.filter(t => favorites.includes(t.item.id)),
    [taggedItems, favorites]
  );

  const toggleTag = (tag: string) => {
    setActiveTags(prev => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const clearFilters = () => {
    setActiveTags(new Set());
    setShowFavOnly(false);
    setQuery('');
  };

  const handleAnchorClick = (id: string) => {
    document
      .getElementById(`resource-cat-${id}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="moholy-surface moholy-surface-tools min-h-screen">
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <header className="mb-6 text-center">
          <p className="mb-2 text-xs font-bold text-canva-purple">AI Bridge Link Library</p>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-canva-ink">링크 도서관</h1>
          <p className="text-sm text-canva-gray">
            카테고리·태그·즐겨찾기·검색을 자유롭게 조합해 자료를 빠르게 찾을 수 있습니다.
          </p>
        </header>

        <div className="sticky top-2 z-20 mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="자료명, 설명, 링크 검색..."
              className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-sm shadow-sm outline-none transition focus:border-canva-purple/40 focus:ring-2 focus:ring-canva-purple/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="검색어 지우기"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowFavOnly(v => !v)}
            disabled={favorites.length === 0}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
              showFavOnly
                ? 'border-amber-400 bg-amber-50 text-amber-700'
                : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-600'
            }`}
          >
            <Star size={11} fill={showFavOnly ? 'currentColor' : 'none'} />
            즐겨찾기
            {favorites.length > 0 && <span className="opacity-60">{favorites.length}</span>}
          </button>
          {visibleTagCounts.map(([tag, count]) => {
            const isOn = activeTags.has(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                  isOn
                    ? 'border-canva-purple bg-canva-purple/10 text-canva-purple'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-canva-purple/40 hover:text-canva-purple'
                }`}
              >
                {tag} <span className="opacity-60">{count}</span>
              </button>
            );
          })}
          {tagCounts.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAllTags(v => !v)}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-bold text-gray-500 transition hover:border-canva-purple/40 hover:text-canva-purple"
            >
              {showAllTags ? '접기' : `+${tagCounts.length - 8}개 더보기`}
              <ChevronDown size={11} className={`transition-transform ${showAllTags ? 'rotate-180' : ''}`} />
            </button>
          )}
          {(activeTags.size > 0 || showFavOnly || query) && (
            <button
              type="button"
              onClick={clearFilters}
              className="ml-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:text-gray-800"
            >
              <X size={11} /> 필터 초기화
            </button>
          )}
        </div>

        {!isFiltering && (
          <>
            {favoriteEntries.length > 0 && (
              <section className="mb-8 scroll-mt-24">
                <header className="mb-3 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                    <Star size={18} fill="currentColor" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <h2 className="text-lg font-extrabold text-canva-ink">
                      즐겨찾기
                      <span className="ml-2 text-xs font-bold text-amber-600">
                        {favoriteEntries.length}
                      </span>
                    </h2>
                    <p className="text-xs text-gray-500">★ 표시한 자료를 한곳에 모아 봅니다</p>
                  </span>
                </header>
                <div className="flex flex-col gap-2">
                  {favoriteEntries.map(entry => (
                    <ResourceCard
                      key={entry.key}
                      item={entry.item}
                      breadcrumb={`${entry.categoryTitle} › ${entry.subCategoryLabel}`}
                      isFav={true}
                      onToggleFav={() => toggleFav(entry.item.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            <nav className="mb-6 flex flex-wrap gap-2">
              {orderedCategories.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleAnchorClick(category.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm transition hover:border-canva-purple/40 hover:text-canva-purple"
                >
                  <span>{category.title}</span>
                  <span className="text-[10px] text-gray-400">{getCategoryCount(category)}</span>
                </button>
              ))}
            </nav>

            <div className="space-y-10">
              {orderedCategories.map(category => {
                const Icon = category.icon;
                return (
                  <section
                    key={category.id}
                    id={`resource-cat-${category.id}`}
                    className="scroll-mt-24"
                  >
                    <header className="mb-3 flex items-center gap-3">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-xl ${category.iconBg}`}
                      >
                        <Icon size={18} className={category.iconColor} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <h2 className="text-lg font-extrabold text-canva-ink">
                          {category.title}
                          <span className="ml-2 text-xs font-bold text-canva-purple">
                            {getCategoryCount(category)}
                          </span>
                        </h2>
                        <p className="text-xs text-gray-500">{category.subtitle}</p>
                      </span>
                    </header>

                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {category.subCategories.map(sub => (
                        <SubCategoryDoor
                          key={sub.id}
                          subCategory={sub}
                          categoryId={category.id}
                          favorites={favorites}
                          onToggleFav={toggleFav}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}

        {isFiltering && (
          <section>
            <p className="mb-3 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500">
              <span>
                필터 결과 <span className="text-canva-purple">{filteredResults.length}</span>건
              </span>
              {showFavOnly && <span className="text-amber-600">★ 즐겨찾기만</span>}
              {activeTags.size > 0 && (
                <span className="text-canva-purple">#{[...activeTags].join(' #')}</span>
              )}
              {normalizedQuery && <span className="text-gray-700">"{query}"</span>}
            </p>
            {filteredResults.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center text-sm text-gray-400">
                조건에 맞는 자료가 없습니다.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {filteredResults.map(({ item, categoryTitle, subCategoryLabel, key }) => (
                  <ResourceCard
                    key={key}
                    item={item}
                    breadcrumb={`${categoryTitle} › ${subCategoryLabel}`}
                    query={normalizedQuery}
                    isFav={favorites.includes(item.id)}
                    onToggleFav={() => toggleFav(item.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
