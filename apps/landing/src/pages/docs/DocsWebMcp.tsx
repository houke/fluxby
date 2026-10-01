import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import CodeBlock from '../../components/docs/CodeBlock';

const example = `const context = document.modelContext;
const tools = await context.getTools();
const tool = tools.find((item) => item.name === 'fluxby_transactions');
if (tool) {
  const json = await context.executeTool(tool, { limit: 5 });
  const result = JSON.parse(json);
  console.log(result.items);
}`;

export default function DocsWebMcp() {
  const { t } = useLanguage();
  const copy = t.webMcp.docs;

  return (
    <article className='prose prose-gray dark:prose-invert max-w-none'>
      <h1>{copy.title}</h1>
      <p className='text-xl'>{copy.intro}</p>

      <h2>{copy.architectureTitle}</h2>
      <p>{copy.architecture}</p>

      <h2>{copy.lifecycleTitle}</h2>
      <p>{copy.lifecycle}</p>

      <h2>{copy.securityTitle}</h2>
      <p>{copy.security}</p>

      <h2>{copy.toolsTitle}</h2>
      <p>{copy.toolsIntro}</p>
      <div className='not-prose overflow-x-auto'>
        <table className='w-full border-collapse text-sm'>
          <thead>
            <tr className='border-b text-left'>
              <th className='py-2 pr-4'>{copy.viewHeader}</th>
              <th className='py-2'>{copy.toolsHeader}</th>
            </tr>
          </thead>
          <tbody>
            {copy.rows.map(([view, tools]) => (
              <tr key={view} className='border-b align-top'>
                <td className='py-2 pr-4'>{view}</td>
                <td className='py-2 font-mono text-xs break-all'>{tools}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>{copy.contractsTitle}</h2>
      <div className='not-prose overflow-x-auto'>
        <table className='w-full border-collapse text-sm'>
          <thead>
            <tr className='border-b text-left'>
              <th className='py-2 pr-4'>{copy.toolsHeader}</th>
              <th className='py-2 pr-4'>{copy.inputHeader}</th>
              <th className='py-2'>{copy.resultHeader}</th>
            </tr>
          </thead>
          <tbody>
            {copy.contracts.map(([name, input, result]) => (
              <tr key={name} className='border-b align-top'>
                <td className='py-2 pr-4 font-mono text-xs whitespace-nowrap'>
                  {name}
                </td>
                <td className='py-2 pr-4 font-mono text-xs'>{input}</td>
                <td className='py-2'>{result}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>{copy.writesTitle}</h2>
      <p>{copy.writes}</p>

      <h2>{copy.exampleTitle}</h2>
      <p>{copy.exampleIntro}</p>
      <div className='not-prose'>
        <CodeBlock
          code={example}
          language='javascript'
          title={copy.exampleTitle}
        />
      </div>

      <h2>{copy.schemasTitle}</h2>
      <p>{copy.schemas}</p>

      <h2>{copy.errorsTitle}</h2>
      <p>{copy.errors}</p>

      <h2>{copy.compatibilityTitle}</h2>
      <p>{copy.compatibility}</p>
      <ul>
        <li>
          <a href='https://webmachinelearning.github.io/webmcp/'>
            https://webmachinelearning.github.io/webmcp/
          </a>
        </li>
        <li>
          <a href='https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md'>
            https://github.com/webmachinelearning/webmcp/blob/main/implementation-status.md
          </a>
        </li>
      </ul>

      <h2>{copy.apiTitle}</h2>
      <p>{copy.api}</p>
      <p>
        <Link to='/help/webmcp'>{copy.helpLink}</Link>
      </p>
    </article>
  );
}
