from setuptools import setup, find_packages

setup(
    name="workspace-logger",
    version="1.0.0",
    description="Universal 5-column server logging, Starlette middleware, and process supervisor for Workspace",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "starlette>=0.37.0",
        "fastapi>=0.111.0",
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
