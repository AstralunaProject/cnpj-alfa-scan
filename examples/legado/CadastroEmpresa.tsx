import { IMaskInput } from "react-imask";

interface Empresa {
  nome: string;
  cnpj: number;
}

export function CadastroEmpresa() {
  return (
    <form>
      <input name="nome" type="text" />
      <input
        name="cnpj"
        type="number"
        maxLength={14}
      />
      <IMaskInput name="cnpjMatriz" mask="00.000.000/0000-00" inputMode="numeric" />
    </form>
  );
}
