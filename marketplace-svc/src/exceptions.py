from fastapi import HTTPException, status


class InsufficientCredit(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=status.HTTP_402_PAYMENT_REQUIRED, detail="Insufficient credit")


class ResourceUnavailable(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail="No available resource")


class NotOwner(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail="Not the owner of this resource")


class DuplicateEmail(HTTPException):
    def __init__(self) -> None:
        super().__init__(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
