import { Trophy } from 'lucide-react';

export function splitPrizePool(value) {
  const text=String(value || '').trim();
  // Only promote an explicitly stated leading amount; never sum or invent prizes.
  const match=text.match(/^((?:₹|\$|€|£|INR\s*|USD\s*|Rs\.?\s*)\d[\d,]*(?:\.\d+)?(?:\s*(?:lakh|crore|million|thousand|k|m))?\+?)(?:\s*(?:prize\s+pool|pool|in\s+prizes))?(?:\s*[—–:|\-]\s*|\s*$)/i);
  return match?{headline:match[1],details:text.slice(match[0].length).trim()}:{headline:text,details:''};
}

export default function PrizePool({value,compact=false}) {
  if(!value)return null;
  const {headline,details}=splitPrizePool(value);
  return <div className={`tw-prize-highlight ${compact?'is-compact':''}`}>
    <span className="tw-prize-trophy" aria-hidden="true"><Trophy size={compact?20:28}/></span>
    <div className="tw-prize-copy"><span className="tw-prize-label">PRIZE POOL</span><strong className={headline.length>32?'is-description':''}>{headline}</strong>{details&&<p>{details}</p>}</div>
  </div>;
}
