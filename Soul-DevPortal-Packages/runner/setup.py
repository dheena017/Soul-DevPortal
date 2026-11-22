from setuptools import setup, find_packages

setup(
    name="workspace-runner",
    version="1.0.0",
    description="Universal Process Supervision, Port Conflict Resolution and Fullstack Dev Runners for Workspace",
    packages=find_packages(),
    include_package_data=True,
    install_requires=[
        "workspace-logger>=1.0.0",
    ],
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
