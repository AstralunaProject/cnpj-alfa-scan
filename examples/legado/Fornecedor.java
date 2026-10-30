package br.com.exemplo;

public class Fornecedor {
    private String nome;
    private Long cnpj;

    public int digito(String cnpj, int i) {
        return Character.getNumericValue(cnpj.charAt(i));
    }

    public long chave() {
        return Long.parseLong(cnpj.toString());
    }
}
