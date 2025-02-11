import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const SimpleMarkdown = ({ content }) => {
  const renderMarkdown = (text) => {
    if (!text) return null;
    
    // Split into lines for processing
    return text.split('\n').map((line, index) => {
      // Headers
      if (line.startsWith('# ')) {
        return <h1 key={index} className="text-2xl font-bold mb-4">{line.slice(2)}</h1>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={index} className="text-xl font-bold mb-3">{line.slice(3)}</h2>;
      }
      if (line.startsWith('### ')) {
        return <h3 key={index} className="text-lg font-bold mb-2">{line.slice(4)}</h3>;
      }

      // Lists
      if (line.startsWith('- ')) {
        return (
          <ul key={index} className="list-disc ml-6 mb-2">
            <li>{line.slice(2)}</li>
          </ul>
        );
      }
      
      // Bold
      let processedLine = line;
      processedLine = processedLine.replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>'
      );
      
      // Italic
      processedLine = processedLine.replace(
        /\*(.*?)\*/g,
        '<em>$1</em>'
      );

      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-4"></div>;
      }

      // Regular paragraphs
      return (
        <p 
          key={index} 
          className="mb-4 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processedLine }}
        />
      );
    });
  };

  return <div className="markdown-content">{renderMarkdown(content)}</div>;
};

const QuoteGenerator = () => {
  const [markdownInput, setMarkdownInput] = useState('');
  const [showQuote, setShowQuote] = useState(false);
  const [editedQuote, setEditedQuote] = useState('');

  const handleGenerateQuote = () => {
    setEditedQuote(markdownInput);
    setShowQuote(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      {!showQuote ? (
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="text-sm text-gray-500 mb-2">
                Supported markdown: Headers (#, ##, ###), Bold (**text**), Italic (*text*), Lists (- item)
              </div>
              <Textarea
                className="min-h-[400px] w-full p-4 font-mono text-base"
                placeholder="Enter your markdown here..."
                value={markdownInput}
                onChange={(e) => setMarkdownInput(e.target.value)}
              />
              <Button 
                className="w-full"
                onClick={handleGenerateQuote}
              >
                Generate Quote
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="print:hidden space-x-4">
            <Button 
              onClick={() => setShowQuote(false)}
              variant="outline"
            >
              Back to Editor
            </Button>
            <Button 
              onClick={handlePrint}
            >
              Save as PDF
            </Button>
          </div>
          
          <div id="quotePrintArea" className="bg-white p-8 shadow-lg min-h-[842px] w-full max-w-[800px] mx-auto">
            {/* Space for logo */}
            <div className="h-24 mb-8 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
              Logo Placeholder
            </div>
            
            {/* Quote content with markdown rendering */}
            <div className="quote-content">
              <SimpleMarkdown content={editedQuote} />
            </div>

            {/* Hidden textarea for editing */}
            <Textarea
              className="w-full min-h-[600px] p-4 border-none focus:outline-none resize-none text-base leading-relaxed hidden print:hidden"
              value={editedQuote}
              onChange={(e) => setEditedQuote(e.target.value)}
            />
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @media print {
          @page {
            margin: 20mm;
            size: A4;
          }
          
          body * {
            visibility: hidden;
          }
          
          #quotePrintArea,
          #quotePrintArea * {
            visibility: visible;
          }
          
          #quotePrintArea {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .quote-content {
            font-size: 12pt !important;
            line-height: 1.6 !important;
          }
          
          .print\\:hidden {
            display: none !important;
          }
        }
        
        .quote-content {
          padding: 1rem;
        }
      `}</style>
    </div>
  );
};

export default QuoteGenerator;
