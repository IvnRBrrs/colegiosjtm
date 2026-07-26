'use client';
import React from 'react';
// import { HistoricoData } from '@/types/historico';

export interface HistoricoData {
    aluno: string;
    nascimento: string;
    pai: string;
    mae: string;
    naturalidade: string;
    disciplinas?: any[];
}

const historico_logo = '/stj/assets/logo.png';
const historico_logo_bandeira = '/stj/assets/bandeira.png';

const defaultDisciplinas = [
    { nome: 'LÍNGUA PORTUGUESA', n1: '-', n2: 'A', n3: '9,5', n4: '-', n5: '9,0', n6: '10,0/200', n7: '9,0/200', n8: '7,5/200', n9: '7,5/200', m1: '9,3/100', m2: '', m3: '', ano: '2015', serie: '1º ANO', escola: 'ESCOLA DE ENS. FUND.\nNIKOLAS PANOS', cidade: 'MACEIÓ/AL', sit: 'APC' },
    { nome: 'MATEMÁTICA', n1: '-', n2: '-', n3: '6,5', n4: '-', n5: '8,0', n6: '9,0/200', n7: '9,0/200', n8: '7,5/200', n9: '6,0/200', m1: '6,9/100', m2: '', m3: '', ano: '2016', serie: '1º/2º', escola: 'ESCOLA DE ENS. FUND.\nNIKOLAS PANOS', cidade: 'MACEIÓ/AL', sit: 'APC' },
    { nome: 'HISTÓRIA', n1: '-', n2: '-', n3: '9,5', n4: '-', n5: '9,0', n6: '8,0/80', n7: '8,5/80', n8: '8,0/80', n9: '9,0/80', m1: '8,9/66,4', m2: '', m3: '', ano: '2017', serie: '2º/3º', escola: 'ESCOLA TIA HELENA', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
    { nome: 'GEOGRAFIA', n1: '-', n2: '-', n3: '9,5', n4: '-', n5: '9,0', n6: '9,5/80', n7: '9,5/80', n8: '8,0/80', n9: '9,5/80', m1: '9,0/66,4', m2: '', m3: '', ano: '2018', serie: '3º/4º', escola: 'ESCOLA TIA HELENA', cidade: 'MACEIÓ/AL', sit: 'APC' },
    { nome: 'CIÊNCIAS', n1: 'A', n2: 'A', n3: '10,0', n4: 'A', n5: '9,0', n6: '10,0/80', n7: '8,0/80', n8: '7,0/80', n9: '7,5/80', m1: '', m2: '', m3: '', ano: '2019', serie: '4º/5º', escola: 'ESCOLA DE ED. BÁSICA\nDIANTE DO TRONO', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
    { nome: 'ARTES', n1: '-', n2: '-', n3: '9,5', n4: 'P', n5: '10,0', n6: '10,0/40', n7: '8,5/40', n8: '9,0/50', n9: '8,5/50', m1: '8,6/33,2', m2: '', m3: '', ano: '2020', serie: '5º/6º', escola: 'ESCOLA DE ENS.FUND.\nESPAÇO DO GURY', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
    { nome: 'L.E.M. INGLÊS', n1: '-', n2: 'A', n3: '10,0', n4: 'C', n5: '9,0', n6: '8,5/80', n7: '9,0/80', n8: '9,0/80', n9: '8,0/80', m1: '8,9/33,2', m2: '', m3: '', ano: '2021', serie: '6º/7º', escola: 'ESCOLA DE ENS.FUND.\nESPAÇO DO GURY', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
    { nome: 'CIDADANIA', n1: '-', n2: 'P', n3: '-', n4: 'P', n5: '-', n6: '10,0/40', n7: '10,0/40', n8: '9,5/50', n9: '-', m1: '', m2: '', m3: '', ano: '2022', serie: '7º/8º', escola: 'ESCOLA DE ENS.FUND.\nESPAÇO DO GURY', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
    { nome: 'EDUCAÇÃO FÍSICA', n1: '-', n2: 'C', n3: '10,0', n4: 'C', n5: '10,0', n6: '9,0/40', n7: '10,0/40', n8: '8,0/50', n9: '8,0/50', m1: '10,0/33,2', m2: '', m3: '', ano: '2023', serie: '8º/9º', escola: 'ESCOLA DE ENS.FUND.\nESPAÇO DO GURY', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
    { nome: 'FILOSOFIA', n1: '-', n2: '-', n3: '-', n4: '-', n5: '-', n6: '-', n7: '-', n8: '8,0/40', n9: '9,0/50', m1: '8,0/50', m2: '', m3: '', ano: '2025', serie: '1º SÉRIE', escola: 'COLÉGIO SÃO JUDAS\nTADEU', cidade: 'MACEIÓ/AL', sit: 'APROVADO' },
];

function formatDateBR(val: string): string {
    if (!val) return val
    const meses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO']
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        const [y, m, d] = val.split('-')
        return `${parseInt(d)} DE ${meses[parseInt(m) - 1]} DE ${y}`
    }
    const d = new Date(val.replace(' ', 'T'))
    if (!isNaN(d.getTime())) {
        const dia = d.getDate()
        const mes = meses[d.getMonth()]
        const ano = d.getFullYear()
        return `${dia} DE ${mes} DE ${ano}`
    }
    return val
}

export const PDFPreview = ({ data }: { data: HistoricoData }) => {
    const aluno = data?.aluno || '';
    const nascimento = data?.nascimento ? formatDateBR(data.nascimento) : '16 DE DEZEMBRO DE 2001';
    const pai = data?.pai || '';
    const mae = data?.mae || '';
    const naturalidade = data?.naturalidade || 'MACEIÓ/AL';
    const disciplinas = (data?.disciplinas && data.disciplinas.length > 0) ? data.disciplinas : defaultDisciplinas;

    return (
        <div className="pdf-preview-container w-full overflow-x-auto p-4 print:p-0 print:overflow-visible bg-zinc-100 print:bg-white flex justify-center">
            <style>{`
                .pdf-preview-container * {
                    border-width: 0;
                    border-style: solid;
                    border-color: currentColor;
                    print-color-adjust: exact;
                    -webkit-print-color-adjust: exact;
                }
                .pdf-preview-container .border {
                    border-width: 1px;
                }
                .pdf-preview-container .border-r {
                    border-right-width: 1px;
                }
                .pdf-preview-container .border-black {
                    border-color: #000;
                }
                .pdf-preview-container .border-zinc-500 {
                    border-color: rgb(113 113 122);
                }
            `}</style>
            <div className="w-[1122px] min-w-[1122px] h-[793px] print:w-full print:h-screen print:p-[12mm] bg-white border border-black shadow-lg print:shadow-none flex flex-col items-center overflow-hidden print:overflow-visible p-0 text-[10px]">
                <div
                    className="grid w-full h-full text-[10px]"
                    style={{
                        gridTemplateColumns: '15% 35% 15% 35%',
                        gridTemplateRows: 'repeat(40, 1fr)',
                    }}
                >
                    {/* 1. CABEÇALHO ROXO (linhas 1 a 4) */}
                    <div className="col-span-4 row-span-4 p-1 flex flex-row items-center justify-between border border-zinc-500">
                        <div className="flex items-center justify-start h-full w-[25%] pl-2">
                            <img src="/stj/assets/logo.png" className="h-full w-auto max-h-16 object-contain" />
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="text-[14px] font-bold">COLÉGIO SÃO JUDAS TADEU</div>
                            <div className="text-[10px]">CNPJ 24.464.554/0001-08</div>
                            <div className="text-[10px]">Rua Adolfo Gustavo, 435, Serraria.</div>
                            <div className="text-[10px]">Maceió-AL, CEP 57046-341.</div>
                        </div>
                        <div className="flex items-center justify-end h-full w-[25%] pr-2">
                            <img src="/stj/assets/bandeira.png" className="h-full w-auto max-h-16 object-contain" />
                        </div>
                    </div>

                    {/* 2. DADOS DO ALUNO (linhas 5 e 6) bg-[#d8dbdf]*/}
                    <div className="col-span-2 row-start-5  flex items-center px-2 border border-zinc-500">
                        ALUNO (A): <span className="font-semibold ml-1">{aluno}</span>
                    </div>
                    <div className="col-span-2 row-start-5  flex items-center px-2 border border-zinc-500">
                        DATA DE NASCIMENTO: <span className="font-semibold ml-1">{nascimento}</span>
                    </div>
                    <div className="col-span-2 row-start-6  flex items-center px-2 border border-zinc-500">
                        NOME DO PAI: <span className="font-semibold ml-1">{pai}</span>
                    </div>
                    <div className="col-span-2 row-start-6  flex items-center px-2 border border-zinc-500">
                        NOME DA MÃE: <span className="font-semibold ml-1">{mae}</span>
                    </div>

                    {/* Linha 7 bg-[#d8dbdf]*/}
                    <div className="col-span-4 row-start-7 flex flex-row w-full border border-zinc-500">
                        <div className="w-[35%] min-w-[35%]  flex items-center px-2 border-r border-zinc-500">
                            NATURALIDADE: <span className="font-semibold ml-1">{naturalidade}</span>
                        </div>
                        <div className="w-[65%] min-w-[65%] flex items-center px-2 text-[9px] font-medium">
                            AUTORIZAÇÃO DE FUNCIONAMENTO PORTARIA 1088/2007, PUBLICADO NO DIÁRIO OFICIAL DE 11/12/2007.
                        </div>
                    </div>

                    {/* Linha 8 - Barra azul escura */}
                    <div className="col-span-4 row-start-8 bg-[#417acf] border border-zinc-500" />

                    {/* 3. CABEÇALHO DA TABELA (linhas 9 e 10) */}
                    {/* bg-[#f6dcc9] */}
                    <div className="col-span-1 row-start-9  flex items-center justify-center font-bold border border-zinc-500">
                        NOTAS E CONCEITOS
                    </div>
                    <div className="col-span-2 row-start-9 flex border border-zinc-500">
                        {/* bg-[#e1efe3] */}
                        <div className="w-[75.1%]  flex items-center justify-center font-bold border-r border-zinc-500">
                            ENSINO FUNDAMENTAL
                        </div>
                        {/* bg-[#f6dcc9] */}
                        <div className="w-[24.9%]  flex items-center justify-center font-bold">
                            ENSINO MÉDIO
                        </div>
                    </div>
                    <div className="col-span-1 row-start-9  flex items-center justify-center font-bold border border-zinc-500">
                        HISTÓRICO ANTERIOR
                    </div>
                    {/* bg-[#f6dcc9] */}
                    <div className="col-span-1 row-start-10  flex items-center justify-center font-bold border border-zinc-500">
                        DISCIPLINAS
                    </div>
                    {/* bg-[#e1efe3]  */}
                    <div className="col-span-2 row-start-10 flex border border-zinc-500">
                        <div className="flex-1 flex items-center justify-center border-r border-zinc-500 text-[8px] font-semibold">1° ANO</div>
                        <div className="flex-1 flex items-center justify-center border-r border-zinc-500 text-[8px] font-semibold">1°/2°</div>
                        <div className="flex-1 flex items-center justify-center border-r border-zinc-500 text-[8px] font-semibold">2°/3°</div>
                        <div className="flex-1 flex items-center justify-center border-r border-zinc-500 text-[8px] font-semibold">3°/4°</div>
                        <div className="flex-1 flex items-center justify-center border-r border-zinc-500 text-[8px] font-semibold">4°/5°</div>
                        <div className="flex-1 flex items-center justify-center border-r border-zinc-500 text-[8px] font-semibold">5°/6°/CH</div>
                        <div className="flex-1 flex items-center justify-center border-r border-zinc-500 text-[8px] font-semibold">6°/7°/CH</div>
                        <div className="flex-1 flex items-center justify-center border-r border-zinc-500 text-[8px] font-semibold">7°/8°/CH</div>
                        <div className="flex-1 flex items-center justify-center border-r border-zinc-500 text-[8px] font-semibold">8°/9°/CH</div>
                        <div className="flex-1 flex items-center justify-center border-r border-zinc-500 text-[8px] font-semibold">1ª SÉRIE</div>
                        <div className="flex-1 flex items-center justify-center border-r border-zinc-500 text-[8px] font-semibold">2ª SÉRIE</div>
                        <div className="flex-1 flex items-center justify-center text-[8px] font-semibold">3ª SÉRIE</div>
                    </div>
                    {/* bg-[#e2e8f1] */}
                    <div className="col-span-1 row-start-10  flex border border-zinc-500 text-[8px]">
                        <div className="w-[9%]  flex items-center justify-center border-r border-zinc-500 font-semibold">ANO</div>
                        <div className="w-[9%]  flex items-center justify-center border-r border-zinc-500 font-semibold">SÉRIE</div>
                        <div className="w-[46%]  flex items-center justify-center border-r border-zinc-500 font-semibold">ESCOLA</div>
                        <div className="w-[18%]  flex items-center justify-center border-r border-zinc-500 font-semibold">CIDADE/UF</div>
                        <div className="w-[16%]  flex items-center justify-center font-semibold">SIT.</div>
                    </div>

                    {/* 4. CORPO DA TABELA (linhas 11 a 39) */}
                    {Array.from({ length: 25 }).map((_, idx) => {
                        const rowIndex = 11 + idx;
                        const d = disciplinas[idx] || {};

                        return (
                            <React.Fragment key={idx}>
                                {/* Coluna 1 - Disciplina bg-[#f6dcc9]*/}
                                <div
                                    className="col-span-1  border border-zinc-500 flex items-center px-1 text-[8px] font-semibold truncate"
                                    style={{ gridRowStart: rowIndex }}
                                >
                                    {d.nome || ''}
                                </div>

                                {/* Colunas 2 & 3 - Notas e Médias bg-[#e1efe3] */}
                                <div
                                    className="col-span-2  border border-zinc-500 flex text-[8px]"
                                    style={{ gridRowStart: rowIndex }}
                                >
                                    <div className="flex-1 flex items-center justify-center border-r border-zinc-500">{d.n1 || ''}</div>
                                    <div className="flex-1 flex items-center justify-center border-r border-zinc-500">{d.n2 || ''}</div>
                                    <div className="flex-1 flex items-center justify-center border-r border-zinc-500">{d.n3 || ''}</div>
                                    <div className="flex-1 flex items-center justify-center border-r border-zinc-500">{d.n4 || ''}</div>
                                    <div className="flex-1 flex items-center justify-center border-r border-zinc-500">{d.n5 || ''}</div>
                                    <div className="flex-1 flex items-center justify-center border-r border-zinc-500">{d.n6 || ''}</div>
                                    <div className="flex-1 flex items-center justify-center border-r border-zinc-500">{d.n7 || ''}</div>
                                    <div className="flex-1 flex items-center justify-center border-r border-zinc-500">{d.n8 || ''}</div>
                                    <div className="flex-1 flex items-center justify-center border-r border-zinc-500">{d.n9 || ''}</div>
                                    <div className="flex-1 flex items-center justify-center border-r border-zinc-500">{d.m1 || ''}</div>
                                    <div className="flex-1 flex items-center justify-center border-r border-zinc-500">{d.m2 || ''}</div>
                                    <div className="flex-1 flex items-center justify-center">{d.m3 || ''}</div>
                                </div>

                                {/* Coluna 4 - Histórico Anterior (apenas para as 15 primeiras linhas) bg-[#e2e8f1] */}
                                {idx < 15 ? (
                                    <div
                                        className="col-span-1  border border-zinc-500 flex text-[8px]"
                                        style={{ gridRowStart: rowIndex }}
                                    >
                                        <div className="w-[9%] flex items-center justify-center border-r border-zinc-500">{d.ano || ''}</div>
                                        <div className="w-[9%] flex items-center justify-center border-r border-zinc-500">{d.serie || ''}</div>
                                        <div className="w-[46%] flex items-center justify-center border-r border-zinc-500 px-1 truncate">{d.escola || ''}</div>
                                        <div className="w-[18%] flex items-center justify-center border-r border-zinc-500">{d.cidade || ''}</div>
                                        <div className="w-[16%] flex items-center justify-center">{d.sit || ''}</div>
                                    </div>
                                ) : null}
                            </React.Fragment>
                        );
                    })}

                    {/* Bloco de Observações (Coluna 4, da linha 26 à 39) bg-[#b0d2e5]*/}
                    <div className="col-span-1 row-start-26 row-span-10  border border-zinc-500 flex flex-col items-center p-2 text-center text-[8px] leading-tight">
                        <div className="font-bold mb-1">OBSERVAÇÕES</div>
                        <p className="mb-1">
                            1°, 2° E 4° Ano – APC Aluno aprovado em progressão continuada em consonância à resolução CEB/CEE/AL N°n08/2007.
                            3° e 5° Ano – O aluno será aprovado se obtiver Média Global Final igual ou superior a 6,0.
                            6° ao 9° ano e Ensino Médio – Média Anual igual ou superior a 6,0 em cada componente curricular.
                            * Frequência obrigatória de 75% no total de horas letivas.
                        </p>
                        <p className="mb-1">
                            Considerando a Lei 9394/96 art. 24, Inc VII; o Parecer CNE 05/97; a Resolução CEE/AL Nº 51/2002 e o que determina a Portaria Seduc/AL Nº 7.132/2020, Art. 1º A verificação da regularidade e autenticidade da vida escolar far-se-á exclusivamente na escola, atesto a autenticidade do documento.
                        </p>
                        <div className="font-bold uppercase mt-1">ESPAÇO RESERVADO PARA A SECRETARIA DE EDUCAÇÃO DO ESTADO</div>
                    </div>

                    {/* 5. RODAPÉ (linhas 40 a 44) bg-[#dfd6e2]*/}
                    <div className="col-span-4 row-start-36 row-span-5  border border-zinc-500 flex justify-between items-center px-6 text-[10px]">
                        <div className="flex flex-col items-center justify-center text-center w-[35%] pt-3">
                            <div>___________________________________________________________________</div>
                            <div className="font-bold">Monica Barros da Silva</div>
                            <div className="text-[9px]">Secretária</div>
                            <div className="text-[9px] text-zinc-600">Reg. 187/04 DS/AL</div>
                        </div>

                        <div className="flex items-center justify-center font-bold text-center w-[30%]">
                            Maceió-AL, 19 de Junho de 2026
                        </div>

                        <div className="flex flex-col items-center justify-center text-center w-[35%] pt-3">
                            <div>___________________________________________________________________</div>
                            <div className="font-bold">Maria Aparecida Lopes</div>
                            <div className="text-[9px]">Diretora</div>
                            <div className="text-[9px] text-zinc-600">Nº 353/87 – LP 4205</div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PDFPreview;
