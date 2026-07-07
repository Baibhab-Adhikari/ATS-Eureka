import markdown
from xhtml2pdf import pisa
from htmldocx import HtmlToDocx
from docx import Document
import io

def markdown_to_pdf(md_text: str) -> io.BytesIO:
    html_content = markdown.markdown(md_text)
    # Basic styling for professional resume
    styled_html = f"""
    <html>
    <head>
        <style>
            @page {{
                size: A4;
                margin: 2cm;
            }}
            body {{
                font-family: Helvetica, Arial, sans-serif;
                font-size: 11pt;
                line-height: 1.5;
                color: #333333;
            }}
            h1, h2, h3 {{
                color: #222222;
            }}
            h1 {{
                font-size: 24pt;
                border-bottom: 2px solid #333333;
                padding-bottom: 4px;
                margin-bottom: 12px;
            }}
            h2 {{
                font-size: 16pt;
                border-bottom: 1px solid #cccccc;
                padding-bottom: 4px;
                margin-top: 16px;
                margin-bottom: 8px;
            }}
            h3 {{
                font-size: 13pt;
                margin-top: 12px;
                margin-bottom: 4px;
            }}
            p, li {{
                margin-bottom: 6px;
            }}
            ul {{
                padding-left: 20px;
            }}
        </style>
    </head>
    <body>
        {html_content}
    </body>
    </html>
    """
    
    pdf_stream = io.BytesIO()
    pisa_status = pisa.CreatePDF(styled_html, dest=pdf_stream)
    pdf_stream.seek(0)
    return pdf_stream

def markdown_to_docx(md_text: str) -> io.BytesIO:
    html_content = markdown.markdown(md_text)
    doc = Document()
    new_parser = HtmlToDocx()
    new_parser.add_html_to_document(html_content, doc)
    
    # Change default font to Arial or Helvetica
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Arial'
    
    out_stream = io.BytesIO()
    doc.save(out_stream)
    out_stream.seek(0)
    return out_stream
