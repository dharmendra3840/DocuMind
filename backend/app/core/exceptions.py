from fastapi import HTTPException, status

CredentialsException = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

ForbiddenException = HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access forbidden")

NotFoundException = lambda detail="Not found": HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)

ConflictException = lambda detail="Conflict": HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)

UnprocessableException = lambda detail="Unprocessable": HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)
