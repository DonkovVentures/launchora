import { useState } from 'react';
import { Plus, GripVertical, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BLOCK_TYPES = [
  { type: 'cover', label: '🖼️ Cover Page', icon: '🖼️' },
  { type: 'toc', label: '📋 Table of Contents', icon: '📋' },
  { type: 'section', label: '📝 Text Section', icon: '📝' },
  { type: 'checklist', label: '✅ Checklist', icon: '✅' },
  { type: 'worksheet', label: '📄 Worksheet', icon: '📄' },
  { type: 'prompt', label: '💡 Prompt Block', icon: '💡' },
  { type: 'notes', label: '📓 Notes Page', icon: '📓' },
  { type: 'listing', label: '🛒 Listing Copy', icon: '🛒' },
];

function BlockItem({ block, isActive, onSelect, onDelete, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  return (
    <div
      onClick={() => onSelect(block.id)}
      className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
        isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/60 border border-transparent'
      }`}
    >
      <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
          {block.heading || block.type}
        </p>
        <p className="text-[10px] text-muted-foreground capitalize">{block.type}</p>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={e => { e.stopPropagation(); onMoveUp(); }} disabled={!canMoveUp} className="p-0.5 rounded hover:bg-muted disabled:opacity-30">
          <ChevronUp className="w-3 h-3" />
        </button>
        <button onClick={e => { e.stopPropagation(); onMoveDown(); }} disabled={!canMoveDown} className="p-0.5 rounded hover:bg-muted disabled:opacity-30">
          <ChevronDown className="w-3 h-3" />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-0.5 rounded hover:bg-destructive/10 hover:text-destructive">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function StudioSidebar({ blocks, activeBlock, onSelectBlock, onBlocksChange, product }) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const addBlock = (type) => {
    const newBlock = {
      id: String(Date.now()),
      type,
      heading: BLOCK_TYPES.find(b => b.type === type)?.label || type,
      content: getDefaultContent(type),
    };
    onBlocksChange([...blocks, newBlock]);
    onSelectBlock(newBlock.id);
    setShowAddMenu(false);
  };

  const deleteBlock = (id) => {
    onBlocksChange(blocks.filter(b => b.id !== id));
    if (activeBlock === id) onSelectBlock(null);
  };

  const moveBlock = (id, dir) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const newBlocks = [...blocks];
    const swap = idx + dir;
    if (swap < 0 || swap >= newBlocks.length) return;
    [newBlocks[idx], newBlocks[swap]] = [newBlocks[swap], newBlocks[idx]];
    onBlocksChange(newBlocks);
  };

  const d = product?.generated_data || {};

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col flex-shrink-0 overflow-hidden">
      {/* Product meta */}
      <div className="p-4 border-b border-border">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Product Info</p>
        <p className="text-xs text-foreground font-medium">{product?.product_type}</p>
        <p className="text-xs text-muted-foreground">{product?.platform} · {product?.niche}</p>
        {d.price_min && (
          <p className="text-xs font-bold text-primary mt-1">${d.price_min}–${d.price_max}</p>
        )}
      </div>

      {/* Block list */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2 px-1">Blocks ({blocks.length})</p>
        <div className="space-y-1">
          {blocks.map((block, idx) => (
            <BlockItem
              key={block.id}
              block={block}
              isActive={activeBlock === block.id}
              onSelect={onSelectBlock}
              onDelete={() => deleteBlock(block.id)}
              onMoveUp={() => moveBlock(block.id, -1)}
              onMoveDown={() => moveBlock(block.id, 1)}
              canMoveUp={idx > 0}
              canMoveDown={idx < blocks.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Add block */}
      <div className="p-3 border-t border-border relative">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddMenu(!showAddMenu)}
          className="w-full h-8 text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Add Block
        </Button>
        {showAddMenu && (
          <div className="absolute bottom-14 left-3 right-3 bg-card border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden">
            {BLOCK_TYPES.map(bt => (
              <button
                key={bt.type}
                onClick={() => addBlock(bt.type)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-muted transition-colors flex items-center gap-2"
              >
                <span>{bt.icon}</span>
                <span>{bt.label.replace(/^.+\s/, '')}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getDefaultContent(type) {
  switch (type) {
    case 'cover': return { title: 'New Product', subtitle: 'Your subtitle here', promise: '' };
    case 'toc': return { items: ['Chapter 1', 'Chapter 2', 'Chapter 3'] };
    case 'section': return { heading: 'New Section', body: 'Write your content here...' };
    case 'checklist': return { title: 'Checklist', items: ['Item 1', 'Item 2', 'Item 3'] };
    case 'worksheet': return { title: 'Worksheet', instructions: 'Complete the exercises below.', questions: ['Question 1', 'Question 2'] };
    case 'prompt': return { title: 'Prompt Block', intro: 'Use these prompts to...', prompts: ['Prompt 1', 'Prompt 2'] };
    case 'notes': return { title: 'Notes', lines: 10 };
    case 'listing': return { listing_title: '', listing_description: '', keywords: [] };
    default: return { body: '' };
  }
}