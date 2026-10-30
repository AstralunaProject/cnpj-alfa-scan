from django.db import models


class Empresa(models.Model):
    nome = models.CharField(max_length=150)
    cnpj = models.BigIntegerField(unique=True)


def normalizar(cnpj: str) -> str:
    return str(int(cnpj)).zfill(14)


def eh_valido(cnpj: str) -> bool:
    return cnpj.isdigit() and len(cnpj) == 14
