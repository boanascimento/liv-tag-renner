# Livelo Tag Runner

O Livelo Tag Runner é uma extensão do VSCode que te auxilia na execução de tags de arquivos Guerkins de automações Livelo.

## Como preparar o ambiente

Para que seja possível executar corretamente as ações de teste é preciso que o arquivo `ltrSettings.json` exista no diretório `/app` para o projeto `automation-app`.
- No explorador ao lado esquedo;
- Clicar com o botão direito num campo vazio;
- Selecionar a opção `LRT Prepare`;

Executados os passos anteriores, a extensão criará o arquivo na pasta sugerida.

## Como usar

Estando em um dos projetos de automação livelo documentados nas notas releases:
- Vá em um arquivo Gherkin do projeto;
- Selecione a tag que deseja executar;
- Cliquei com o botão direito do mouse;
- Escolha uma das opções Liv Tag Runner.

![Exemplo de uso do LTR](https://user-images.githubusercontent.com/22202005/94815627-22185400-03d1-11eb-8d08-7381c21aee98.gif)

A extensão vai abrir um novo terminal no VSCode e executará a tag exatamente como foi selecionada. Então vale ter atenção ao selecionar toda a tag.

## Release Notes

Nesta versão você pode:
- Executar tags para os projetos `automation-api`, `automation-pj`, `automation-app` e `automation-store`.
